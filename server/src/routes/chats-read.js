// Endpoint para marcar como leídos los mensajes de un chat
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';
import { clearMessageCaches } from './messages.js';

const router = Router();

router.post('/:chatId/read', authRequired, async (req, res) => {
  try {
    const { messages } = await getCollections();
    const chatId = req.params.chatId;
    const userId = req.user.sub;

    await messages.updateMany(
      { chatId, recipientId: userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    clearMessageCaches();

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

export default router;
