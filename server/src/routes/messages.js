import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();
const INBOX_CACHE_TTL_MS = 15000;
const THREAD_CACHE_TTL_MS = 10000;
const USERS_SEARCH_TTL_MS = 15000;
const inboxCache = new Map();
const threadCache = new Map();
const userSearchCache = new Map();

function getCacheEntry(store, key) {
  const entry = store.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) {
      store.delete(key);
    }
    return null;
  }
  return entry.payload;
}

function setCacheEntry(store, key, payload, ttlMs) {
  store.set(key, { payload, expiresAt: Date.now() + ttlMs });
}

export function clearMessageCaches() {
  inboxCache.clear();
  threadCache.clear();
}

function toObjectId(value) {
  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
}

function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
}

function serializeMessage(message) {
  return {
    id: message._id.toString(),
    text: message.text,
    senderId: message.senderId.toString(),
    recipientId: message.recipientId.toString(),
    createdAt: message.createdAt,
    readAt: message.readAt || null
  };
}

router.get('/users/search', authRequired, async (req, res) => {
  const query = String(req.query.query || '').trim();

  if (query.length < 2) {
    return res.json({ ok: true, users: [] });
  }

  const cacheKey = `${req.user.sub}:${query.toLowerCase()}`;
  const cached = getCacheEntry(userSearchCache, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const { users } = await getCollections();
  const currentObjectId = new ObjectId(req.user.sub);
  const results = await users.find({
    _id: { $ne: currentObjectId },
    $or: [
      { name: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') }
    ]
  }, { projection: { name: 1, email: 1 } }).limit(8).toArray();

  const payload = {
    ok: true,
    users: results.map(serializeUser)
  };

  setCacheEntry(userSearchCache, cacheKey, payload, USERS_SEARCH_TTL_MS);

  return res.json(payload);
});

router.get('/inbox', authRequired, async (req, res) => {
  const cacheKey = String(req.user.sub);
  const cached = getCacheEntry(inboxCache, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const { messages, users } = await getCollections();
  const currentUserId = String(req.user.sub);
  const currentObjectId = new ObjectId(currentUserId);

  const rawMessages = await messages.find({
    $or: [{ senderId: currentObjectId }, { recipientId: currentObjectId }]
  }, { projection: { senderId: 1, recipientId: 1, text: 1, createdAt: 1, readAt: 1 } }).sort({ createdAt: -1 }).toArray();

  const userIds = Array.from(new Set(rawMessages.flatMap((message) => [message.senderId?.toString(), message.recipientId?.toString()]).filter(Boolean)));
  const userDocs = await users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { projection: { name: 1, email: 1 } }).toArray();
  const userMap = new Map(userDocs.map((user) => [user._id.toString(), serializeUser(user)]));

  const threadMap = new Map();

  for (const message of rawMessages) {
    const senderId = message.senderId.toString();
    const recipientId = message.recipientId.toString();
    const counterpartId = senderId === currentUserId ? recipientId : senderId;
    const previous = threadMap.get(counterpartId);

    if (!previous || new Date(message.createdAt) > new Date(previous.lastMessage.createdAt)) {
      threadMap.set(counterpartId, {
        counterpartId,
        counterpart: userMap.get(counterpartId) || {
          id: counterpartId,
          name: 'Usuario',
          email: ''
        },
        lastMessage: serializeMessage(message),
        unreadCount: (!message.readAt && recipientId === currentUserId) ? 1 : 0
      });
    } else if (!message.readAt && recipientId === currentUserId) {
      previous.unreadCount += 1;
    }
  }

  const payload = {
    ok: true,
    conversations: Array.from(threadMap.values()).sort((left, right) => new Date(right.lastMessage.createdAt) - new Date(left.lastMessage.createdAt))
  };

  setCacheEntry(inboxCache, cacheKey, payload, INBOX_CACHE_TTL_MS);

  return res.json(payload);
});

router.get('/:counterpartId', authRequired, async (req, res) => {
  const counterpartObjectId = toObjectId(req.params.counterpartId);
  const currentObjectId = toObjectId(req.user.sub);

  if (!counterpartObjectId || !currentObjectId) {
    return res.status(422).json({ ok: false, message: 'Conversacion invalida.' });
  }

  const cacheKey = `${currentObjectId.toString()}:${counterpartObjectId.toString()}`;
  const cached = getCacheEntry(threadCache, cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const { messages, users } = await getCollections();
  const threadMessages = await messages.find({
    $or: [
      { senderId: currentObjectId, recipientId: counterpartObjectId },
      { senderId: counterpartObjectId, recipientId: currentObjectId }
    ]
  }).sort({ createdAt: 1 }).toArray();

  const counterpart = await users.findOne({ _id: counterpartObjectId }, { projection: { name: 1, email: 1 } });

  const payload = {
    ok: true,
    counterpart: serializeUser(counterpart) || {
      id: counterpartObjectId.toString(),
      name: 'Usuario',
      email: ''
    },
    messages: threadMessages.map(serializeMessage)
  };

  setCacheEntry(threadCache, cacheKey, payload, THREAD_CACHE_TTL_MS);

  return res.json(payload);
});

router.post('/', authRequired, async (req, res) => {
  const counterpartObjectId = toObjectId(req.body.counterpartId);
  const senderObjectId = toObjectId(req.user.sub);
  const text = String(req.body.text || '').trim();

  if (!counterpartObjectId || !senderObjectId) {
    return res.status(422).json({ ok: false, message: 'Conversacion invalida.' });
  }

  if (!text) {
    return res.status(422).json({ ok: false, message: 'Escribe un mensaje antes de enviarlo.' });
  }

  const { messages, users } = await getCollections();
  const counterpart = await users.findOne({ _id: counterpartObjectId }, { projection: { name: 1, email: 1 } });

  if (!counterpart) {
    return res.status(404).json({ ok: false, message: 'Usuario destinatario no encontrado.' });
  }

  const createdAt = new Date();
  const result = await messages.insertOne({
    senderId: senderObjectId,
    recipientId: counterpartObjectId,
    text,
    createdAt,
    readAt: null
  });

  clearMessageCaches();

  return res.json({
    ok: true,
    message: 'Mensaje enviado correctamente.',
    conversation: {
      id: result.insertedId.toString(),
      text,
      senderId: senderObjectId.toString(),
      recipientId: counterpartObjectId.toString(),
      createdAt,
      readAt: null
    }
  });
});

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

    await chats.updateOne(
      { _id: new ObjectId(chatId) },
      { 
        $set: { 
          lastMessage: text,
          updatedAt: new Date()
        } 
      }
    );

    clearMessageCaches();

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