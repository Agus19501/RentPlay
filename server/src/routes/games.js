import { Router } from 'express';
import { getCollections } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

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
    seller: game.seller || null,
    releaseDate: game.releaseDate || null,
    genre: game.genre || null,
    developers: game.developers || null,
    createdAt: game.createdAt || null
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

router.post('/', authRequired, async (req, res) => {
  try {
    const { title, releaseDate, genre, duration, developers, price, imagePreview } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(422).json({ ok: false, message: 'El título es obligatorio.' });
    }

    const { games } = await getCollections();

    // generate next numeric id
    const last = await games.find().sort({ id: -1 }).limit(1).toArray();
    const nextId = last.length ? Number(last[0].id) + 1 : 1;

    const doc = {
      id: nextId,
      title: String(title).trim(),
      description: '',
      releaseDate: releaseDate || null,
      genre: genre || null,
      rentalDays: Number(duration) || 1,
      developers: developers || null,
      price: price || null,
      image: imagePreview || null,
      seller: req.user?.name || req.user?.email || null,
      createdAt: new Date()
    };

    await games.insertOne(doc);

    return res.json({ ok: true, game: normalizeGame(doc) });
  } catch (error) {
    console.error('Create game error:', error);
    return res.status(500).json({ ok: false, message: 'Error al crear el juego.' });
  }
});

export default router;