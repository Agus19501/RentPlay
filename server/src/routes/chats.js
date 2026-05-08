import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();

// Obtener todas las conversaciones del usuario autenticado
router.get('/', authRequired, async (req, res) => {
  try {
    const { chats, games, users } = await getCollections();
    const userId = req.user.sub;

    // Buscamos chats donde el usuario sea participante
    const userChats = await chats.find({
      participants: userId
    }).sort({ updatedAt: -1 }).toArray();

    // Enriquecer chats con datos de usuario y juego
    const enrichedChats = await Promise.all(userChats.map(async (chat) => {
      const otherUserId = chat.participants.find(p => p !== userId);
      const [otherUser, game] = await Promise.all([
        users.findOne({ _id: new ObjectId(otherUserId) }),
        games.findOne({ _id: new ObjectId(chat.gameId) })
      ]);

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
    }));

    res.json({ ok: true, chats: enrichedChats });
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

    res.json({ ok: true, chatId: chat._id.toString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Obtener mensajes de un chat
router.get('/:chatId/messages', authRequired, async (req, res) => {
  try {
    const { messages } = await getCollections();
    const chatId = req.params.chatId;

    const chatMessages = await messages.find({
      chatId: chatId
    }).sort({ createdAt: 1 }).toArray();

    res.json({ 
      ok: true, 
      messages: chatMessages.map(m => ({
        id: m._id.toString(),
        text: m.text,
        senderId: m.senderId,
        createdAt: m.createdAt
      }))
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