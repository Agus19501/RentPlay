import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

const router = Router();

function createSession(user) {
  const token = jwt.sign(
    {
      sub: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET || 'rentplay-dev-secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

router.post('/register', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(422).json({ ok: false, message: 'Correo invalido.' });
    }

    if (name.length < 2) {
      return res.status(422).json({ ok: false, message: 'Nombre demasiado corto.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ ok: false, message: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    const { users } = await getCollections();
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'Este correo ya esta registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date()
    });

    const session = createSession({
      _id: result.insertedId.toString(),
      name,
      email
    });

    return res.json({ ok: true, message: 'Cuenta creada correctamente.', session });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al crear la cuenta.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(422).json({ ok: false, message: 'Correo invalido.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ ok: false, message: 'Contrasena invalida.' });
    }

    const { users } = await getCollections();
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    return res.json({
      ok: true,
      message: 'Sesion iniciada correctamente.',
      session: createSession({
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      })
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al iniciar sesion.', error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No autorizado.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
    const { users } = await getCollections();
    const user = await users.findOne({ _id: new ObjectId(payload.sub) });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    return res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        birthDate: user.birthDate,
        rating: user.rating || 0,
        reviews: user.reviews || 0
      }
    });
  } catch {
    return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
  }
});

router.put('/update', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No autorizado.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
    const { users } = await getCollections();
    
    const updates = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.email) updates.email = String(req.body.email).trim().toLowerCase();
    if (req.body.avatar) updates.avatar = String(req.body.avatar);
    if (req.body.birthDate) updates.birthDate = String(req.body.birthDate);

    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ ok: false, message: 'No hay campos para actualizar.' });
    }

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(payload.sub) },
      { $set: updates },
      { returnDocument: 'after', returnOriginal: false }
    );

    const updatedUser = result.value || result;

    if (!updatedUser) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    return res.json({
      ok: true,
      message: 'Usuario actualizado correctamente.',
      user: {
        id: (updatedUser._id || updatedUser.id).toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        birthDate: updatedUser.birthDate,
        rating: updatedUser.rating || 0,
        reviews: updatedUser.reviews || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al actualizar usuario.', error: error.message });
  }
});

router.get('/top-rated', async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 10;

    const { users, games } = await getCollections();
    const topUsers = await users
      .find({}, { projection: { name: 1, email: 1, avatar: 1, rating: 1, reviews: 1, createdAt: 1 } })
      .sort({ rating: -1, reviews: -1, createdAt: 1 })
      .limit(limit)
      .toArray();

    const userIds = topUsers.map((user) => user._id);
    const gameCounts = userIds.length
      ? await games.aggregate([
          { $match: { uploadedBy: { $in: userIds } } },
          { $group: { _id: '$uploadedBy', count: { $sum: 1 } } }
        ]).toArray()
      : [];

    const gameCountByUserId = new Map(
      gameCounts.map((item) => [item._id.toString(), item.count])
    );

    return res.json({
      ok: true,
      users: topUsers.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        rating: Number(user.rating || 0),
        reviews: Number(user.reviews || 0),
        gameCount: gameCountByUserId.get(user._id.toString()) || 0,
        createdAt: user.createdAt || null
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener perfiles destacados.', error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { users, games } = await getCollections();
    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // Obtener juegos del usuario
    const userGames = await games.find({ uploadedBy: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();

    function normalizeGame(game) {
      return {
        id: game._id.toString(),
        title: game.title,
        image: game.image,
        price: game.price,
        platform: game.platform,
        available: game.available !== false,
        createdAt: game.createdAt || null
      };
    }

    return res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        rating: user.rating || 0,
        reviews: user.reviews || 0,
        createdAt: user.createdAt || null
      },
      games: userGames.map(normalizeGame)
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener usuario.', error: error.message });
  }
});

router.post('/:userId/rate', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { rating } = req.body; // valor del 1 al 5

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No autorizado. Se requiere iniciar sesion.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
    const reviewerId = payload.sub;

    if (reviewerId === targetUserId) {
      return res.status(403).json({ ok: false, message: 'No puedes valorarte a ti mismo.' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(422).json({ ok: false, message: 'Valoracion invalida (1-5).' });
    }

    if (!ObjectId.isValid(targetUserId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { users } = await getCollections();
    const user = await users.findOne({ _id: new ObjectId(targetUserId) });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // Verificar si ya ha valorado anteriormente
    const ratings = user.voters || [];
    if (ratings.includes(reviewerId)) {
      return res.status(409).json({ ok: false, message: 'Ya has valorado a este usuario.' });
    }

    // Calculamos la nueva media
    const currentRating = user.rating || 0;
    const currentReviews = user.reviews || 0;
    
    const newReviews = currentReviews + 1;
    const newRating = ((currentRating * currentReviews) + rating) / newReviews;

    await users.updateOne(
      { _id: new ObjectId(targetUserId) },
      { 
        $set: { 
          rating: Number(newRating.toFixed(1)), 
          reviews: newReviews 
        },
        $push: { voters: reviewerId }
      }
    );

    return res.json({ 
      ok: true, 
      message: 'Valoracion enviada.', 
      rating: Number(newRating.toFixed(1)),
      reviews: newReviews
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
    }
    return res.status(500).json({ ok: false, message: 'Error al valorar.', error: error.message });
  }
});

export default router;