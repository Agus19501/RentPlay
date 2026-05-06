import { Router } from 'express';
import { getCollections } from '../config/db.js';

const router = Router();

function normalizeGame(game) {
  if (!game) {
    return null;
  }

  return {
    id: game.id,
    title: game.title,
    description: game.description,
    price: game.price,
    rentalDays: game.rentalDays,
    rating: game.rating,
    platform: game.platform,
    image: game.image,
    features: game.features || [],
    seller: game.seller || null
  };
}

router.get('/', async (req, res) => {
  const query = String(req.query.search || '').trim().toLowerCase();
  const { games } = await getCollections();
  const filter = query
    ? {
        $or: [
          { title: new RegExp(query, 'i') },
          { description: new RegExp(query, 'i') }
        ]
      }
    : {};

  const catalog = await games.find(filter).sort({ id: 1 }).toArray();
  return res.json({ ok: true, games: catalog.map(normalizeGame) });
});

router.get('/:gameId', async (req, res) => {
  const gameId = Number(req.params.gameId);

  if (!Number.isFinite(gameId)) {
    return res.status(422).json({ ok: false, message: 'Juego invalido.' });
  }

  const { games } = await getCollections();
  const game = await games.findOne({ id: gameId });

  if (!game) {
    return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
  }

  return res.json({ ok: true, game: normalizeGame(game) });
});

export default router;