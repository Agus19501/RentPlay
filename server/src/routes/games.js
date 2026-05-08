import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function normalizeGame(game) {
  if (!game) {
    return null;
  }

  return {
    id: game._id.toString(),
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
    media: Array.isArray(game.media) ? game.media : [],
    uploadedBy: game.uploadedBy?.toString() || null,
    available: game.available !== false,
    createdAt: game.createdAt || null
  };
}

router.get('/', async (req, res) => {
  try {
    const { search, genre, developer, minYear, maxYear } = req.query;
    const { games, users } = await getCollections();
    
    let filter = {};
    if (search) {
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

    // Enriquecer juegos con datos actuales de usuarios
    const enrichedGames = await Promise.all(
      catalog.map(async (game) => {
        const normalized = normalizeGame(game);
        if (normalized.uploadedBy && ObjectId.isValid(normalized.uploadedBy)) {
          const user = await users.findOne({ _id: new ObjectId(normalized.uploadedBy) });
          if (user) {
            normalized.seller = {
              id: user._id.toString(),
              name: user.name,
              avatar: user.avatar,
              rating: user.rating || 0,
              reviews: user.reviews || 0
            };
          }
        }
        return normalized;
      })
    );

    return res.json({ ok: true, games: enrichedGames });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juegos.', error: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(422).json({ ok: false, message: 'ID de usuario invalido.' });
    }

    const { games } = await getCollections();
    const userGames = await games.find({ uploadedBy: new ObjectId(userId) }).sort({ createdAt: -1 }).toArray();

    return res.json({ ok: true, games: userGames.map(normalizeGame) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juegos del usuario.' });
  }
});

router.get('/:gameId', async (req, res) => {
  try {
    const gameId = req.params.gameId;

    if (!ObjectId.isValid(gameId)) {
      return res.status(422).json({ ok: false, message: 'Juego invalido.' });
    }

    const { games } = await getCollections();
    const game = await games.findOne({ _id: new ObjectId(gameId) });

    if (!game) {
      return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
    }

    return res.json({ ok: true, game: normalizeGame(game) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener juego.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  try {
    console.log('--- POST /api/games intent ---');
    console.log('User from JWT (payload):', req.user);
    const { title, releaseDate, genre, rentalDays, developers, price, image } = req.body || {};

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
      description: '',
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

    return res.json({ ok: true, game: normalizeGame({ ...doc, _id: result.insertedId }) });
  } catch (error) {
    console.error('CRITICAL ERROR POST /api/games:', error);
    return res.status(500).json({ ok: false, message: 'Error interno al crear el juego.', error: error.message });
  }
});

router.put('/:gameId', authRequired, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { title, releaseDate, genre, rentalDays, developers, price, image, media } = req.body;

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
      releaseDate: releaseDate || game.releaseDate,
      genre: genre || game.genre,
      rentalDays: Number(rentalDays) || game.rentalDays,
      developers: developers || game.developers,
      price: price || game.price,
      image: image || game.image,
      media: Array.isArray(media) ? media : (Array.isArray(game.media) ? game.media : [])
    };

    await games.updateOne({ _id: new ObjectId(gameId) }, { $set: updateDoc });

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

    return res.json({ ok: true, message: 'Juego eliminado por completo.' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al eliminar el juego.' });
  }
});

export default router;