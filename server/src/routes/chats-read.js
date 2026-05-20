// Endpoint para marcar como leídos los mensajes de un chat
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();

router.post('/:chatId/read', authRequired, async (req, res) => {
  const { messages } = await getCollections();
  const chatId = req.params.chatId;
  const userId = req.user.sub;

  // Marcar como leídos todos los mensajes recibidos en este chat
  await messages.updateMany(
    { chatId, recipientId: userId, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.json({ ok: true });
});

export default router;
