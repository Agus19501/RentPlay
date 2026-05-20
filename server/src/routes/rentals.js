import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authRequired } from '../middleware/auth.js';
import { getCollections } from '../config/db.js';

const router = Router();

function isBase64Image(str) {
  return typeof str === 'string' && str.startsWith('data:image/');
}

function normalizeGame(game) {
  if (!game) {
    return null;
  }

  const rawImage = game.image || null;
  const gameId = game._id ? game._id.toString() : game.id;
  const image = isBase64Image(rawImage)
    ? `/api/games/${gameId}/cover`
    : rawImage;

  return {
    id: gameId,
    title: game.title,
    description: game.description,
    price: game.price,
    rentalDays: game.rentalDays,
    rating: game.rating,
    platform: game.platform,
    image,
    media: [],
    seller: game.seller || null,
    uploadedBy: game.uploadedBy ? game.uploadedBy.toString() : null
  };
}

router.get('/owner-notifications', authRequired, async (req, res) => {
  try {
    const { rentals, games, users } = await getCollections();
    const ownerId = req.user.sub;
    const ownerObjectId = new ObjectId(ownerId);

    const ownedGames = await games
      .find({ uploadedBy: ownerObjectId }, { projection: { title: 1 } })
      .toArray();

    if (ownedGames.length === 0) {
      return res.json({ ok: true, notifications: [] });
    }

    const ownedGameIds = ownedGames.map((game) => game._id);
    const gameById = new Map(ownedGames.map((game) => [game._id.toString(), game]));

    const pendingRentals = await rentals.find({
      gameId: { $in: ownedGameIds },
      ownerHomeNotifiedAt: null
    }).sort({ createdAt: -1 }).toArray();

    if (pendingRentals.length === 0) {
      return res.json({ ok: true, notifications: [] });
    }

    const renterIds = [...new Set(
      pendingRentals
        .map((rental) => rental.userId?.toString())
        .filter((userId) => userId && ObjectId.isValid(userId) && userId !== ownerId)
    )];

    const renters = renterIds.length
      ? await users.find(
          { _id: { $in: renterIds.map((userId) => new ObjectId(userId)) } },
          { projection: { name: 1 } }
        ).toArray()
      : [];

    const renterById = new Map(renters.map((user) => [user._id.toString(), user]));
    const notifications = pendingRentals
      .map((rental) => {
        const renter = renterById.get(rental.userId?.toString());
        const game = gameById.get(rental.gameId?.toString());

        if (!renter?.name || !game?.title) {
          return null;
        }

        return {
          id: rental._id.toString(),
          rentalId: rental._id.toString(),
          renterName: renter.name,
          gameTitle: game.title,
          createdAt: rental.createdAt,
          message: `${renter.name} te ha alquilado ${game.title}`
        };
      })
      .filter(Boolean);

    if (notifications.length > 0) {
      await rentals.updateMany(
        { _id: { $in: notifications.map((item) => new ObjectId(item.rentalId)) } },
        { $set: { ownerHomeNotifiedAt: new Date() } }
      );
    }

    return res.json({ ok: true, notifications });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener notificaciones de alquiler.', error: error.message });
  }
});

router.get('/mine', authRequired, async (req, res) => {
  const { rentals, games, users } = await getCollections();
  const userId = new ObjectId(req.user.sub);
  const rawRentals = await rentals.find({ userId }).sort({ createdAt: -1 }).toArray();

  const rentalsWithGame = await Promise.all(rawRentals.map(async (rental) => {
    let game = null;
    if (ObjectId.isValid(rental.gameId)) {
      const rawGame = await games.findOne({ _id: new ObjectId(rental.gameId) });
      if (rawGame) {
        game = normalizeGame(rawGame);
        // Enriquecer con vendedor actual
        const sellerId = game.uploadedBy || game.seller?.id || null;
        if (sellerId && ObjectId.isValid(sellerId)) {
          const seller = await users.findOne({ _id: new ObjectId(sellerId) });
          if (seller) {
            game.seller = {
              id: seller._id.toString(),
              name: seller.name,
              avatar: seller.avatar,
              rating: seller.rating || 0,
              reviews: seller.reviews || 0
            };
          }
        }
      }
    }
    
    return {
      id: rental._id.toString(),
      status: rental.status,
      paymentMethod: rental.paymentMethod,
      createdAt: rental.createdAt,
      expiresAt: rental.expiresAt,
      game
    };
  }));

  return res.json({ ok: true, rentals: rentalsWithGame });
});

router.get('/owner-active', authRequired, async (req, res) => {
  try {
    const { rentals, games } = await getCollections();
    const ownerId = req.user.sub;

    if (!ObjectId.isValid(ownerId)) {
      return res.status(422).json({ ok: false, message: 'Usuario invalido.' });
    }

    const ownedGames = await games
      .find({ uploadedBy: new ObjectId(ownerId) }, { projection: { _id: 1 } })
      .toArray();

    if (ownedGames.length === 0) {
      return res.json({ ok: true, activeRentals: [] });
    }

    const now = new Date();
    const ownedGameIds = ownedGames.map((game) => game._id);

    const activeRentals = await rentals.find({
      gameId: { $in: ownedGameIds },
      status: 'active',
      expiresAt: { $gt: now }
    }).toArray();

    return res.json({
      ok: true,
      activeRentals: activeRentals.map((rental) => ({
        id: rental._id.toString(),
        gameId: rental.gameId?.toString() || null,
        expiresAt: rental.expiresAt || null
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al obtener alquileres activos del propietario.' });
  }
});

router.post('/', authRequired, async (req, res) => {
  const { gameId, paymentMethod = 'paypal' } = req.body;

  if (!gameId || !ObjectId.isValid(gameId)) {
    return res.status(422).json({ ok: false, message: 'ID de juego invalido.' });
  }

  const { games, rentals } = await getCollections();
  const game = await games.findOne({ _id: new ObjectId(gameId) });

  if (!game) {
    return res.status(404).json({ ok: false, message: 'Juego no encontrado.' });
  }

  // REGLA 1: No puedes alquilar tu propio juego
  if (game.uploadedBy && game.uploadedBy.toString() === req.user.sub) {
    return res.status(403).json({ ok: false, message: 'No puedes alquilar un juego que tú mismo has subido.' });
  }

  // REGLA 2: No se puede alquilar si ya está alquilado por alguien (o por ti)
  const existingRental = await rentals.findOne({ 
    gameId: new ObjectId(gameId),
    status: 'active',
    expiresAt: { $gt: new Date() }
  });

  if (existingRental) {
    return res.status(409).json({ ok: false, message: 'Este juego ya está alquilado actualmente.' });
  }

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + Number(game.rentalDays || 1) * 24 * 60 * 60 * 1000);

  const result = await rentals.insertOne({
    userId: new ObjectId(req.user.sub),
    gameId: new ObjectId(gameId),
    paymentMethod,
    status: 'active',
    createdAt,
    expiresAt,
    ownerHomeNotifiedAt: null
  });

  // MENSAJE AUTOMATIZADO DEL PROPIETARIO
  try {
    const { chats, messages } = await getCollections();
    const sellerId = game.uploadedBy.toString();
    const buyerId = req.user.sub;

    // 1. Buscar o crear chat entre el dueño y el comprador para este juego
    let chat = await chats.findOne({
      participants: { $all: [buyerId, sellerId] },
      gameId: gameId
    });

    if (!chat) {
      const newChat = {
        participants: [buyerId, sellerId],
        gameId: gameId,
        lastMessage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const chatRes = await chats.insertOne(newChat);
      chat = { ...newChat, _id: chatRes.insertedId };
    }

    // 2. Crear los mensajes automatizados (con el sellerId como remitente)
    const automatedText1 = `¡Disfruta del juego: "${game.title}"!`;
    const automatedText2 = `Ya estás autorizado para jugar.`;

    const msg1 = {
      chatId: chat._id.toString(),
      senderId: sellerId,
      text: automatedText1,
      createdAt: new Date()
    };
    const msg2 = {
      chatId: chat._id.toString(),
      senderId: sellerId,
      text: automatedText2,
      createdAt: new Date(new Date().getTime() + 100) // 100ms después
    };

    await messages.insertMany([msg1, msg2]);

    // 3. Actualizar último mensaje del chat
    await chats.updateOne(
      { _id: chat._id },
      { 
        $set: { 
          lastMessage: automatedText2,
          updatedAt: new Date()
        } 
      }
    );
  } catch (chatError) {
    console.error('Error enviando mensaje automatizado:', chatError);
    // No bloqueamos el alquiler si el chat falla
  }

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