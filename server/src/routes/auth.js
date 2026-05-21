import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { clearGamesListCache } from './games.js';

const router = Router();
const TOP_RATED_CACHE_TTL_MS = 5 * 60 * 1000;
const TOP_RATED_STALE_TTL_MS = 30 * 60 * 1000;
let topRatedCache = null;
let topRatedRefreshPromise = null;
const ratingsCache = new Map();
const RATINGS_CACHE_TTL_MS = 30 * 1000;

function getRatingsCacheKey(targetUserId, reviewerId) {
  return `${targetUserId}:${reviewerId || 'guest'}`;
}

function getCachedRatingsPayload(targetUserId, reviewerId) {
  const key = getRatingsCacheKey(targetUserId, reviewerId);
  const cached = ratingsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  if (cached) {
    ratingsCache.delete(key);
  }

  return null;
}

function setCachedRatingsPayload(targetUserId, reviewerId, payload) {
  ratingsCache.set(getRatingsCacheKey(targetUserId, reviewerId), {
    expiresAt: Date.now() + RATINGS_CACHE_TTL_MS,
    payload
  });
}

function clearRatingsCacheForUser(targetUserId) {
  for (const key of ratingsCache.keys()) {
    if (key.startsWith(`${targetUserId}:`)) {
      ratingsCache.delete(key);
    }
  }
}

function isBase64Image(str) {
  return typeof str === 'string' && str.startsWith('data:image/');
}

function toPublicAvatar(userId, avatar) {
  if (!avatar || typeof avatar !== 'string') {
    return null;
  }

  if (isBase64Image(avatar)) {
    return `/api/auth/${userId}/avatar`;
  }

  return avatar;
}

function clearTopRatedCache() {
  topRatedCache = null;
}

async function refreshTopRatedCache(limit = 10, { maxTimeMs = 1500 } = {}) {
  if (topRatedRefreshPromise) {
    return topRatedRefreshPromise;
  }

  topRatedRefreshPromise = (async () => {
    const { users } = await getCollections();
    const topUsers = await users
      .find({}, { projection: { name: 1, avatar: 1, rating: 1, reviews: 1, createdAt: 1 } })
      .sort({ rating: -1, reviews: -1, createdAt: -1 })
      .hint('users_top_rated_desc_idx')
      .limit(limit)
      .maxTimeMS(maxTimeMs)
      .toArray();

    const payload = {
      ok: true,
      users: topUsers.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        avatar: toPublicAvatar(user._id.toString(), user.avatar),
        rating: Number(user.rating || 0),
        reviews: Number(user.reviews || 0),
        gameCount: 0,
        createdAt: user.createdAt || null
      }))
    };

    topRatedCache = {
      cacheKey: String(limit),
      expiresAt: Date.now() + TOP_RATED_CACHE_TTL_MS,
      staleUntil: Date.now() + TOP_RATED_STALE_TTL_MS,
      payload
    };

    return payload;
  })().finally(() => {
    topRatedRefreshPromise = null;
  });

  return topRatedRefreshPromise;
}

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
    const user = await users.findOne(
      { _id: new ObjectId(payload.sub) },
      { projection: { name: 1, email: 1, avatar: 1, birthDate: 1, rating: 1, reviews: 1 } }
    );

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    return res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: toPublicAvatar(user._id.toString(), user.avatar),
        birthDate: user.birthDate,
        rating: user.rating || 0,
        reviews: user.reviews || 0
      }
    });
  } catch {
    return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
  }
});

router.get('/:userId/avatar', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!ObjectId.isValid(userId)) {
      return res.status(422).send('ID de usuario invalido.');
    }

    const { users } = await getCollections();
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { avatar: 1 } }
    );

    if (!user?.avatar) {
      return res.status(404).send('Avatar no encontrado.');
    }

    if (isBase64Image(user.avatar)) {
      const matches = user.avatar.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).send('Formato de avatar invalido.');
      }

      const mime = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      res.set('Content-Type', mime);
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.send(buffer);
    }

    if (typeof user.avatar === 'string' && /^https?:\/\//i.test(user.avatar)) {
      return res.redirect(user.avatar);
    }

    return res.status(404).send('Avatar no encontrado.');
  } catch {
    return res.status(500).send('Error al servir avatar.');
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


    clearTopRatedCache();
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

    const cacheKey = String(limit);
    if (topRatedCache?.expiresAt > Date.now() && topRatedCache.cacheKey === cacheKey) {
      return res.json(topRatedCache.payload);
    }

    if (topRatedCache?.payload && topRatedCache.cacheKey === cacheKey && topRatedCache.staleUntil > Date.now()) {
      if (!topRatedRefreshPromise) {
        refreshTopRatedCache(limit).catch((error) => {
          console.warn('Top-rated background refresh failed:', error.message);
        });
      }

      return res.json(topRatedCache.payload);
    }

    if (!topRatedRefreshPromise) {
      refreshTopRatedCache(limit, { maxTimeMs: 10000 }).catch((error) => {
        console.warn('Top-rated refresh failed:', error.message);
      });
    }

    if (topRatedCache?.payload && topRatedCache.cacheKey === cacheKey) {
      return res.json(topRatedCache.payload);
    }

    return res.json({ ok: true, users: [] });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener perfiles destacados.', error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const lite = req.query.lite === '1' || req.query.lite === 'true';
    
    if (!ObjectId.isValid(userId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { users, games } = await getCollections();
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: lite ? { name: 1, avatar: 1, rating: 1, reviews: 1, createdAt: 1, birthDate: 1 } : { name: 1, email: 1, avatar: 1, rating: 1, reviews: 1, createdAt: 1, birthDate: 1 } }
    );

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // Obtener juegos del usuario
    const userGames = await games.find(
      { uploadedBy: new ObjectId(userId) },
      lite
        ? { projection: { title: 1, image: 1, price: 1, platform: 1, available: 1, createdAt: 1 } }
        : undefined
    ).sort({ createdAt: -1 }).toArray();

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
        avatar: toPublicAvatar(user._id.toString(), user.avatar),
        rating: user.rating || 0,
        reviews: user.reviews || 0,
        birthDate: user.birthDate || null,
        createdAt: user.createdAt || null
      },
      games: userGames.map(normalizeGame)
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener usuario.', error: error.message });
  }
});

router.get('/:userId/ratings', async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (!ObjectId.isValid(targetUserId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { users, games, rentals } = await getCollections();
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    let reviewerId = null;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
        reviewerId = payload.sub;
      } catch {
        reviewerId = null;
      }
    }

    const cachedPayload = getCachedRatingsPayload(targetUserId, reviewerId);
    if (cachedPayload) {
      return res.json(cachedPayload);
    }

    const user = await users.findOne(
      { _id: new ObjectId(targetUserId) },
      { projection: { ratingComments: 1, voters: 1 } }
    );

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // oldest first
    const ratings = Array.isArray(user.ratingComments)
      ? user.ratingComments
          .slice()
          .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
          .map((entry) => ({
            id: entry.id || `${entry.reviewerId || 'unknown'}-${entry.createdAt || Date.now()}`,
            reviewerId: entry.reviewerId || null,
            reviewerName: entry.reviewerName || 'Usuario',
            reviewerAvatar: entry.reviewerAvatar || null,
            rating: Number(entry.rating || 0),
            comment: String(entry.comment || ''),
            createdAt: entry.createdAt || null
          }))
      : [];

    // Determine if the requesting user can rate (has rented from target and hasn't rated yet)
    let canRate = false;
    if (reviewerId && reviewerId !== targetUserId) {
      const alreadyRated = Array.isArray(user.voters) && user.voters.includes(reviewerId);
      if (!alreadyRated && ObjectId.isValid(reviewerId)) {
        const targetGames = await games
          .find({ uploadedBy: new ObjectId(targetUserId) }, { projection: { _id: 1 } })
          .toArray();
        if (targetGames.length > 0) {
          const rental = await rentals.findOne({
            userId: new ObjectId(reviewerId),
            gameId: { $in: targetGames.map((g) => g._id) }
          });
          canRate = !!rental;
        }
      }
    }

    const payload = { ok: true, ratings, canRate };
    setCachedRatingsPayload(targetUserId, reviewerId, payload);
    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener valoraciones.', error: error.message });
  }
});

router.post('/:userId/rate', async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { rating, comment } = req.body; // valor del 1 al 5 + comentario

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

    const normalizedComment = String(comment || '').trim();
    if (!normalizedComment) {
      return res.status(422).json({ ok: false, message: 'El comentario es obligatorio.' });
    }
    if (normalizedComment.length > 140) {
      return res.status(422).json({ ok: false, message: 'El comentario no puede superar 140 caracteres.' });
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
    const votersList = user.voters || [];
    if (votersList.includes(reviewerId)) {
      return res.status(409).json({ ok: false, message: 'Ya has valorado a este usuario.' });
    }

    // Verificar que el reviewer haya alquilado un juego del target
    const { games, rentals } = await getCollections();
    if (ObjectId.isValid(reviewerId)) {
      const targetGames = await games
        .find({ uploadedBy: new ObjectId(targetUserId) }, { projection: { _id: 1 } })
        .toArray();
      const hasRented = targetGames.length > 0 && !!(await rentals.findOne({
        userId: new ObjectId(reviewerId),
        gameId: { $in: targetGames.map((g) => g._id) }
      }));
      if (!hasRented) {
        return res.status(403).json({ ok: false, message: 'Solo puedes valorar a usuarios cuyo juego hayas alquilado.' });
      }
    }

    // Calculamos la nueva media
    const currentRating = user.rating || 0;
    const currentReviews = user.reviews || 0;
    
    const newReviews = currentReviews + 1;
    const newRating = ((currentRating * currentReviews) + rating) / newReviews;

    const reviewer = await users.findOne(
      { _id: new ObjectId(reviewerId) },
      { projection: { name: 1, avatar: 1 } }
    );

    const ratingEntry = {
      id: new ObjectId().toString(),
      reviewerId,
      reviewerName: reviewer?.name || 'Usuario',
      reviewerAvatar: reviewer?.avatar || null,
      rating: Number(rating),
      comment: normalizedComment,
      createdAt: new Date()
    };

    await users.updateOne(
      { _id: new ObjectId(targetUserId) },
      { 
        $set: { 
          rating: Number(newRating.toFixed(1)), 
          reviews: newReviews 
        },
        $push: {
          voters: reviewerId,
          ratingComments: ratingEntry
        }
      }
    );

    clearGamesListCache();
    clearTopRatedCache();
    clearRatingsCacheForUser(targetUserId);

    return res.json({ 
      ok: true, 
      message: 'Valoracion enviada.', 
      rating: Number(newRating.toFixed(1)),
      reviews: newReviews,
      entry: ratingEntry
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
    }
    return res.status(500).json({ ok: false, message: 'Error al valorar.', error: error.message });
  }
});

export default router;