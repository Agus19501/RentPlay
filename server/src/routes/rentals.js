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
    expiresAt
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