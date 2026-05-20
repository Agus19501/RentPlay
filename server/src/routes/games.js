import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
const GAMES_LIST_CACHE_TTL_MS = 15000;
let gamesListCache = new Map();

function clearGamesListCache() {
  gamesListCache = new Map();
}

// Utilidad para detectar base64
function isBase64Image(str) {
  return typeof str === 'string' && str.startsWith('data:image/');
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildGamesCacheKey(query) {
  const normalized = {
    search: String(query.search || '').trim().toLowerCase(),
    title: String(query.title || '').trim().toLowerCase(),
    genre: String(query.genre || '').trim().toLowerCase(),
    developer: String(query.developer || '').trim().toLowerCase(),
    minYear: String(query.minYear || '').trim(),
    maxYear: String(query.maxYear || '').trim(),
    lite: query.lite === '1' || query.lite === 'true'
  };

  return JSON.stringify(normalized);
}

function normalizeGame(game, { includeBase64Image = true, includeMedia = true } = {}) {
  if (!game) {
    return null;
  }

  const rawImage = game.image || null;
  const imageIsBase64 = isBase64Image(rawImage);

  const gameId = game._id.toString();

  let listingImage = null;
  if (rawImage) {
    listingImage = imageIsBase64
      ? `/api/games/${gameId}/cover`
      : rawImage;
  }

  return {
    id: gameId,
    title: game.title,
    description: game.description,
    price: game.price,
    rentalDays: game.rentalDays,
    rating: game.rating,
    platform: game.platform,
    image: includeBase64Image ? rawImage : listingImage,
    features: game.features || [],
    seller: game.seller || null,
    releaseDate: game.releaseDate || null,
    genre: game.genre || null,
    developers: game.developers || null,
    media: includeMedia && Array.isArray(game.media)
      ? game.media.map((m, index) => {
          const rawMediaData = m?.data;
          const mediaIsBase64 = isBase64Image(rawMediaData) || (typeof rawMediaData === 'string' && rawMediaData.startsWith('data:video'));
          return {
            type: m.type,
            name: m.name,
            data: mediaIsBase64
              ? (includeBase64Image ? rawMediaData : `/api/games/${gameId}/media/${index}`)
              : rawMediaData
          };
        })
      : [],
    uploadedBy: game.uploadedBy?.toString() || null,
    available: game.available !== false,
    createdAt: game.createdAt || null
  };
}

// Endpoint para servir la portada como archivo
router.get('/:gameId/cover', async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!ObjectId.isValid(gameId)) {
      return res.status(422).send('ID de juego inválido.');
    }
    const { games } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });
    if (!game || !game.image) {
      return res.status(404).send('Portada no encontrada.');
    }
    if (isBase64Image(game.image)) {
      // Extraer tipo y datos
      const matches = game.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!matches) return res.status(400).send('Formato base64 inválido.');
      const mime = matches[1];
      const data = matches[2];
      const imgBuffer = Buffer.from(data, 'base64');
      res.set('Content-Type', mime);
      res.set('Cache-Control', 'public, max-age=31536000');
      return res.send(imgBuffer);
    } else if (typeof game.image === 'string') {
      // Redirigir a la URL si es externa
      return res.redirect(game.image);
    } else {
      return res.status(404).send('Portada no encontrada.');
    }
  } catch (e) {
    return res.status(500).send('Error al servir portada.');
  }
});

router.get('/:gameId/media/:mediaIndex', async (req, res) => {
  try {
    const { gameId, mediaIndex } = req.params;
    if (!ObjectId.isValid(gameId)) {
      return res.status(422).send('ID de juego inválido.');
    }

    const index = Number(mediaIndex);
    if (!Number.isInteger(index) || index < 0) {
      return res.status(422).send('Índice de media inválido.');
    }

    const { games } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });
    const media = Array.isArray(game?.media) ? game.media : [];
    const item = media[index];
    const rawData = item?.data;

    if (!rawData || typeof rawData !== 'string' || !rawData.startsWith('data:')) {
      return res.status(404).send('Media no encontrada.');
    }

    const matches = rawData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).send('Formato de media inválido.');
    }

    const mime = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=31536000');
    return res.send(buffer);
  } catch (error) {
    return res.status(500).send('Error al servir media.');
  }
});


router.get('/', async (req, res) => {
  try {
    const { search, title, genre, developer, minYear, maxYear, lite } = req.query;
    const isLiteListing = lite === '1' || lite === 'true';
    const cacheKey = buildGamesCacheKey(req.query);
    const cached = gamesListCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.payload);
    }

    const { games, users, rentals } = await getCollections();
    
    let filter = {};
    if (title) {
      filter.title = new RegExp(`^${escapeRegex(String(title).trim())}$`, 'i');
    } else if (search) {
      const regex = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { genre: regex },
        { platform: regex }
      ];
    }

    if (genre && genre !== 'Todos' && genre !== 'All') {
      filter.genre = genre;
    }

    if (developer && developer !== 'Todos' && developer !== 'All') {
      filter.developers = developer;
    }

    if (minYear || maxYear) {
      filter.$expr = { $and: [] };
      
      // Helper to express: { $year: { $dateFromString: { dateString: "$releaseDate", format: "%d/%m/%Y" } } }
      const getYearExpr = { 
        $year: { 
          $dateFromString: { 
            dateString: "$releaseDate", 
            format: "%d/%m/%Y",
            onError: 0 // If format doesn't match, return 0 to avoid crash
          } 
        } 
      };

      if (minYear && minYear !== '1970') {
        filter.$expr.$and.push({ $gte: [getYearExpr, parseInt(minYear)] });
      }
      if (maxYear && maxYear !== '2026') {
        filter.$expr.$and.push({ $lte: [getYearExpr, parseInt(maxYear)] });
      }

      // If no conditions were added, remove $expr
      if (filter.$expr.$and.length === 0) {
        delete filter.$expr;
      }
    }

    console.log('Final Mongo Filter:', JSON.stringify(filter));

    const catalog = await games.find(filter).sort({ createdAt: -1 }).toArray();

    // Determinar qué juegos tienen un alquiler activo ahora mismo
    const catalogIds = catalog.map((g) => g._id);
    const activeRentals = catalogIds.length
      ? await rentals.find({
          gameId: { $in: catalogIds },
          status: 'active',
          expiresAt: { $gt: new Date() }
        }, { projection: { gameId: 1 } }).toArray()
      : [];
    const rentedGameIds = new Set(activeRentals.map((r) => r.gameId.toString()));

    let enrichedGames = [];
    if (isLiteListing) {
      enrichedGames = catalog.map((game) => {
        const normalized = normalizeGame(game, { includeBase64Image: false, includeMedia: false });
        if (rentedGameIds.has(normalized.id)) normalized.status = 'rented';
        return normalized;
      });
    } else {
      // Enriquecer juegos con datos actuales de usuarios en una sola consulta
      const uploaderIds = [...new Set(
        catalog
          .map((game) => game.uploadedBy?.toString())
          .filter((id) => id && ObjectId.isValid(id))
      )];

      const uploaderUsers = uploaderIds.length
        ? await users.find({ _id: { $in: uploaderIds.map((id) => new ObjectId(id)) } }).toArray()
        : [];

      const usersById = new Map(
        uploaderUsers.map((user) => [user._id.toString(), user])
      );

      enrichedGames = catalog.map((game) => {
        const normalized = normalizeGame(game, { includeBase64Image: false });
        if (rentedGameIds.has(normalized.id)) normalized.status = 'rented';
        const user = normalized.uploadedBy ? usersById.get(normalized.uploadedBy) : null;
        if (user) {
          normalized.seller = {
            id: user._id.toString(),
            name: user.name,
            avatar: user.avatar,
            rating: user.rating || 0,
            reviews: user.reviews || 0
          };
        }
        return normalized;
      });
    }

    const payload = { ok: true, games: enrichedGames };

    gamesListCache.set(cacheKey, {
      expiresAt: Date.now() + GAMES_LIST_CACHE_TTL_MS,
      payload
    });

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juegos.', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const lite = req.query.lite === '1' || req.query.lite === 'true';
    
    if (!ObjectId.isValid(userId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { games } = await getCollections();
    const userGames = await games.find({ uploadedBy: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();

    return res.json({
      ok: true,
      games: userGames.map((game) => normalizeGame(game, {
        includeBase64Image: !lite,
        includeMedia: !lite
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juegos del usuario.' });
  }
});

router.get('/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;
    const compact = req.query.compact === '1' || req.query.compact === 'true';

    if (!ObjectId.isValid(gameId)) {
      return res.status(422).json({ ok: false, message: 'Juego invalido.' });
    }

    const { games } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
    }

    return res.json({
      ok: true,
      game: normalizeGame(game, {
        includeBase64Image: !compact,
        includeMedia: true
      })
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juego.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  try {
    console.log('--- POST /api/games intent ---');
    console.log('User from JWT (payload):', req.user);
    const { title, description, releaseDate, genre, rentalDays, developers, price, image } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(422).json({ ok: false, message: 'El título es obligatorio.' });
    }

    const { games, users } = await getCollections();

    // Obtener datos del usuario actual usando req.user.sub (del JWT)
    const userIdStr = req.user.sub || req.user.id || req.user._id;
    console.log('Searching user with ID:', userIdStr);

    if (!userIdStr || !ObjectId.isValid(userIdStr)) {
      console.error('Invalid ID format in JWT:', userIdStr);
      return res.status(401).json({ ok: false, message: 'Token de sesión corrupto o incompleto.' });
    }

    const user = await users.findOne({ _id: new ObjectId(userIdStr) });

    if (!user) {
      console.error('User not found in DB for ID:', userIdStr);
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado en la base de datos.' });
    }

    const doc = {
      title: String(title).trim(),
      description: description || '',
      releaseDate: releaseDate || null,
      genre: genre || null,
      rentalDays: Number(rentalDays) || 1,
      developers: developers || null,
      price: price || null,
      image: image || null,
      media: req.body.media || [], // Guardar todas las imágenes/videos subidos
      uploadedBy: user._id,
      seller: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      },
      available: true,
      createdAt: new Date()
    };

    console.log('Inserting game document...');
    const result = await games.insertOne(doc);
    console.log('Game inserted successfully:', result.insertedId);

    clearGamesListCache();

    return res.json({ ok: true, game: normalizeGame({ ...doc, _id: result.insertedId }) });
  } catch (error) {
    console.error('CRITICAL ERROR POST /api/games:', error);
    return res.status(500).json({ ok: false, message: 'Error interno al crear el juego.', error: error.message });
  }
});

router.put('/:gameId', authRequired, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { title, description, releaseDate, genre, rentalDays, developers, price, image, media } = req.body;

    if (!ObjectId.isValid(gameId)) {
      return res.status(422).json({ ok: false, message: 'ID de juego inválido.' });
    }

    const { games, rentals } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
    }

    if (game.uploadedBy.toString() !== req.user.sub) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para editar este juego.' });
    }

    // Verificar si está alquilado
    const activeRental = await rentals.findOne({
      gameId: new ObjectId(gameId),
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (activeRental) {
      return res.status(409).json({ ok: false, message: 'No puedes editar un juego que está alquilado actualmente.' });
    }

    const updateDoc = {
      title: title?.trim() || game.title,
      description: typeof description === 'string' ? description : game.description,
      releaseDate: releaseDate || game.releaseDate,
      genre: genre || game.genre,
      rentalDays: Number(rentalDays) || game.rentalDays,
      developers: developers || game.developers,
      price: price || game.price,
      image: image || game.image,
      media: Array.isArray(media) ? media : (Array.isArray(game.media) ? game.media : [])
    };

    await games.updateOne({ _id: new ObjectId(gameId) }, { $set: updateDoc });

    clearGamesListCache();

    return res.json({ ok: true, message: 'Juego actualizado correctamente.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al actualizar el juego.' });
  }
});

router.delete('/:gameId', authRequired, async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!ObjectId.isValid(gameId)) {
      return res.status(422).json({ ok: false, message: 'ID de juego inválido.' });
    }

    const { games, rentals } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
    }

    if (game.uploadedBy.toString() !== req.user.sub) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para eliminar este juego.' });
    }

    // Eliminar el juego y sus posibles alquileres
    await Promise.all([
      games.deleteOne({ _id: new ObjectId(gameId) }),
      rentals.deleteMany({ gameId: new ObjectId(gameId) })
    ]);

    clearGamesListCache();

    return res.json({ ok: true, message: 'Juego eliminado por completo.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al eliminar el juego.' });
  }
});

export default router;