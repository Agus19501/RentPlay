import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();

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

  const { users } = await getCollections();
  const currentObjectId = new ObjectId(req.user.sub);
  const results = await users.find({
    _id: { $ne: currentObjectId },
    $or: [
      { name: new RegExp(query, 'i') },
      { email: new RegExp(query, 'i') }
    ]
  }).limit(8).toArray();

  return res.json({
    ok: true,
    users: results.map(serializeUser)
  });
});

router.get('/inbox', authRequired, async (req, res) => {
  const { messages, users } = await getCollections();
  const currentUserId = String(req.user.sub);
  const currentObjectId = new ObjectId(currentUserId);

  const rawMessages = await messages.find({
    $or: [{ senderId: currentObjectId }, { recipientId: currentObjectId }]
  }).sort({ createdAt: -1 }).toArray();

  const userIds = Array.from(new Set(rawMessages.flatMap((message) => [message.senderId?.toString(), message.recipientId?.toString()]).filter(Boolean)));
  const userDocs = await users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }).toArray();
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

  return res.json({
    ok: true,
    conversations: Array.from(threadMap.values()).sort((left, right) => new Date(right.lastMessage.createdAt) - new Date(left.lastMessage.createdAt))
  });
});

router.get('/:counterpartId', authRequired, async (req, res) => {
  const counterpartObjectId = toObjectId(req.params.counterpartId);
  const currentObjectId = toObjectId(req.user.sub);

  if (!counterpartObjectId || !currentObjectId) {
    return res.status(422).json({ ok: false, message: 'Conversacion invalida.' });
  }

  const { messages, users } = await getCollections();
  const threadMessages = await messages.find({
    $or: [
      { senderId: currentObjectId, recipientId: counterpartObjectId },
      { senderId: counterpartObjectId, recipientId: currentObjectId }
    ]
  }).sort({ createdAt: 1 }).toArray();

  const counterpart = await users.findOne({ _id: counterpartObjectId });

  return res.json({
    ok: true,
    counterpart: serializeUser(counterpart) || {
      id: counterpartObjectId.toString(),
      name: 'Usuario',
      email: ''
    },
    messages: threadMessages.map(serializeMessage)
  });
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
  const counterpart = await users.findOne({ _id: counterpartObjectId });

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

export default router;