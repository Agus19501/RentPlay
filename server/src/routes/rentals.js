import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
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
    seller: game.seller || null
  };
}

router.get('/mine', authRequired, async (req, res) => {
  const { rentals, games } = await getCollections();
  const userId = new ObjectId(req.user.sub);
  const rawRentals = await rentals.find({ userId }).sort({ createdAt: -1 }).toArray();

  const rentalsWithGame = await Promise.all(rawRentals.map(async (rental) => ({
    id: rental._id.toString(),
    status: rental.status,
    paymentMethod: rental.paymentMethod,
    createdAt: rental.createdAt,
    expiresAt: rental.expiresAt,
    game: normalizeGame(await games.findOne({ id: rental.gameId }))
  })));

  return res.json({ ok: true, rentals: rentalsWithGame });
});

router.post('/', authRequired, async (req, res) => {
  const gameId = Number(req.body.gameId);
  const paymentMethod = String(req.body.paymentMethod || 'paypal');

  if (!Number.isFinite(gameId)) {
    return res.status(422).json({ ok: false, message: 'Juego invalido.' });
  }

  const { games, rentals } = await getCollections();
  const game = await games.findOne({ id: gameId });

  if (!game) {
    return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + Number(game.rentalDays || 1) * 24 * 60 * 60 * 1000);

  const result = await rentals.insertOne({
    userId: new ObjectId(req.user.sub),
    gameId,
    paymentMethod,
    status: 'active',
    createdAt,
    expiresAt
  });

  return res.json({
    ok: true,
    message: 'Alquiler creado correctamente.',
    rental: {
      id: result.insertedId.toString(),
      game: normalizeGame(game),
      paymentMethod,
      status: 'active',
      createdAt,
      expiresAt
    }
  });
});

export default router;