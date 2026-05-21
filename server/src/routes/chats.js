import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();
const CHATS_CACHE_TTL_MS = 15000;
const chatsCache = new Map();

function getChatsCache(userId) {
  const entry = chatsCache.get(userId);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) chatsCache.delete(userId);
    return null;
  }
  return entry.payload;
}

function setChatsCache(userId, payload) {
  chatsCache.set(userId, { payload, expiresAt: Date.now() + CHATS_CACHE_TTL_MS });
}

function clearChatsCache() {
  chatsCache.clear();
}

function toCompactChat(chat, userId) {
  const otherUserId = chat.participants?.find((p) => p !== userId) || null;

  return {
    id: chat._id.toString(),
    participants: chat.participants || [],
    gameId: chat.gameId || null,
    lastMessage: chat.lastMessage || '',
    updatedAt: chat.updatedAt,
    user: {
      id: otherUserId,
      name: 'Usuario',
      avatar: null,
      rating: 0
    },
    game: {
      id: chat.gameId ? chat.gameId.toString() : null,
      title: '',
      image: null,
      price: null,
      rentalDays: null
    }
  };
}

// Obtener todas las conversaciones del usuario autenticado
router.get('/', authRequired, async (req, res) => {
  try {
    const { chats, games, users } = await getCollections();
    const userId = req.user.sub;
    const compact = req.query.compact === '1' || req.query.lite === '1';
    const cacheKey = `${userId}:${compact ? 'compact' : 'full'}`;

    const cached = getChatsCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    if (compact) {
      const compactChats = await chats.find(
        { participants: userId },
        { projection: { participants: 1, gameId: 1, lastMessage: 1, updatedAt: 1 } }
      ).sort({ updatedAt: -1 }).toArray();

      const payload = {
        ok: true,
        chats: compactChats.map((chat) => toCompactChat(chat, userId))
      };

      setChatsCache(cacheKey, payload);
      return res.json(payload);
    }

    // Buscamos chats donde el usuario sea participante
    const userChats = await chats.find({
      participants: userId
    }).sort({ updatedAt: -1 }).toArray();

    if (userChats.length === 0) {
      return res.json({ ok: true, chats: [] });
    }

    const otherUserIds = [...new Set(
      userChats
        .map((chat) => chat.participants.find((p) => p !== userId))
        .filter(Boolean)
    )];

    const gameIds = [...new Set(
      userChats
        .map((chat) => chat.gameId?.toString())
        .filter(Boolean)
    )];

    const [otherUsers, gamesDocs] = await Promise.all([
      otherUserIds.length
        ? users.find(
            { _id: { $in: otherUserIds.map((id) => new ObjectId(id)) } },
            { projection: { name: 1, avatar: 1, rating: 1 } }
          ).toArray()
        : Promise.resolve([]),
      gameIds.length
        ? games.find(
            { _id: { $in: gameIds.map((id) => new ObjectId(id)) } },
            { projection: { title: 1, image: 1, price: 1, rentalDays: 1 } }
          ).toArray()
        : Promise.resolve([])
    ]);

    const userById = new Map(otherUsers.map((user) => [user._id.toString(), user]));
    const gameById = new Map(gamesDocs.map((game) => [game._id.toString(), game]));

    // Enriquecer chats con datos de usuario y juego
    const enrichedChats = userChats.map((chat) => {
      const otherUserId = chat.participants.find(p => p !== userId);
      const otherUser = otherUserId ? userById.get(otherUserId) : null;
      const game = chat.gameId ? gameById.get(chat.gameId.toString()) : null;

      return {
        id: chat._id.toString(),
        participants: chat.participants,
        gameId: chat.gameId,
        lastMessage: chat.lastMessage || '',
        updatedAt: chat.updatedAt,
        user: otherUser ? {
          id: otherUser._id.toString(),
          name: otherUser.name,
          avatar: otherUser.avatar,
          rating: otherUser.rating || 0
        } : null,
        game: game ? {
          id: game._id.toString(),
          title: game.title,
          image: game.image,
          price: game.price,
          rentalDays: game.rentalDays
        } : null
      };
    });

    const payload = { ok: true, chats: enrichedChats };
    setChatsCache(cacheKey, payload);
    return res.json(payload);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Crear o recuperar un chat (para el botón de contactar)
router.post('/', authRequired, async (req, res) => {
  try {
    const { sellerId, gameId } = req.body;
    const userId = req.user.sub;

    if (!sellerId || !gameId) {
      return res.status(400).json({ ok: false, message: 'Faltan datos (sellerId o gameId)' });
    }

    if (sellerId === userId) {
      return res.status(400).json({ ok: false, message: 'No puedes iniciar un chat contigo mismo' });
    }

    const { chats } = await getCollections();

    // Buscar chat existente para esta pareja y ese juego específico
    let chat = await chats.findOne({
      participants: { $all: [userId, sellerId] },
      gameId: gameId
    });

    if (!chat) {
      const newChat = {
        participants: [userId, sellerId],
        gameId: gameId,
        lastMessage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await chats.insertOne(newChat);
      chat = { ...newChat, _id: result.insertedId };
    }

    clearChatsCache();

    res.json({ ok: true, chatId: chat._id.toString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Obtener mensajes de un chat
router.get('/:chatId/messages', authRequired, async (req, res) => {
  try {
    const { messages, chats } = await getCollections();
    const chatId = req.params.chatId;
    const userId = req.user.sub;

    const chatMessages = await messages.find({
      chatId: chatId
    }).sort({ createdAt: 1 }).toArray();

    let normalizedMessages = chatMessages.map(m => ({
      id: m._id.toString(),
      text: m.text,
      senderId: m.senderId,
      createdAt: m.createdAt
    }));

    // Legacy chats may have only lastMessage in chat doc and no rows in messages collection.
    if (normalizedMessages.length === 0) {
      const chatDoc = await chats.findOne({ _id: new ObjectId(chatId) });
      if (chatDoc?.lastMessage) {
        const counterpartId = (chatDoc.participants || []).find((p) => p !== userId) || userId;
        normalizedMessages = [{
          id: `fallback-${chatDoc._id.toString()}`,
          text: chatDoc.lastMessage,
          senderId: counterpartId,
          createdAt: chatDoc.updatedAt || chatDoc.createdAt || new Date()
        }];
      }
    }

    res.json({ 
      ok: true, 
      messages: normalizedMessages
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Enviar mensaje
router.post('/:chatId/messages', authRequired, async (req, res) => {
  try {
    const { text } = req.body;
    const chatId = req.params.chatId;
    const userId = req.user.sub;

    if (!text) return res.status(400).json({ ok: false, message: 'Texto vacío' });

    const { messages, chats } = await getCollections();

    const newMessage = {
      chatId,
      senderId: userId,
      text,
      createdAt: new Date()
    };

    const result = await messages.insertOne(newMessage);

    // Actualizar el último mensaje en el chat
    await chats.updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $set: { 
          lastMessage: text,
          updatedAt: new Date()
        } 
      }
    );
    clearChatsCache();

    res.json({
      ok: true,
      message: {
        id: result.insertedId.toString(),
        ...newMessage
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

export default router;