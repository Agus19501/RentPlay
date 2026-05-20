import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'rentplay';

let client;
let clientPromise;
let indexesEnsured = false;

function getRootPath() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');
}

export async function getDb() {
  if (!clientPromise) {
    client = new MongoClient(mongoUri, {
      maxPoolSize: 5,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      retryWrites: true,
    });
    clientPromise = client.connect().catch(error => {
      clientPromise = null;
      client = null;
      throw new Error(`MongoDB connection error: ${error.message}`);
    });
  }

  try {
    await clientPromise;
    return client.db(databaseName);
  } catch (error) {
    clientPromise = null;
    client = null;
    throw error;
  }
}

export async function getCollections() {
  try {
    const db = await getDb();
    return {
      db,
      users: db.collection('users'),
      games: db.collection('games'),
      rentals: db.collection('rentals'),
      messages: db.collection('messages'),
      chats: db.collection('chats')
    };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Database connection failed. Please check MONGODB_URI in environment variables.');
  }
}

export async function seedGamesIfNeeded() {
  try {
    const { games } = await getCollections();
    const count = await games.countDocuments();

    if (count > 0) {
      return;
    }

    const gamesPath = path.join(getRootPath(), 'data', 'games.json');
    const payload = JSON.parse(await readFile(gamesPath, 'utf8'));
    const catalog = Array.isArray(payload.games) ? payload.games : [];

    if (catalog.length > 0) {
      await games.insertMany(catalog.map((game) => ({
        ...game,
        createdAt: new Date()
      })));
    }
  } catch (error) {
    console.error('Seed error:', error);
  }
}

export async function ensureIndexes() {
  if (indexesEnsured) {
    return;
  }

  const { games, users, rentals, chats, messages } = await getCollections();

  await Promise.all([
    users.createIndex({ email: 1 }, { name: 'users_email_idx' }),
    users.createIndex({ rating: -1, reviews: -1, createdAt: -1 }, { name: 'users_top_rated_desc_idx' }),
    users.createIndex({ createdAt: -1 }, { name: 'users_createdAt_idx' }),

    games.createIndex({ uploadedBy: 1 }, { name: 'games_uploadedBy_idx' }),
    games.createIndex({ createdAt: -1 }, { name: 'games_createdAt_idx' }),
    games.createIndex({ title: 1 }, { name: 'games_title_idx' }),
    games.createIndex({ genre: 1 }, { name: 'games_genre_idx' }),
    games.createIndex({ developers: 1 }, { name: 'games_developers_idx' }),

    rentals.createIndex({ userId: 1, createdAt: -1 }, { name: 'rentals_user_createdAt_idx' }),
    rentals.createIndex({ gameId: 1, status: 1, expiresAt: -1 }, { name: 'rentals_game_status_expiresAt_idx' }),
    rentals.createIndex({ ownerHomeNotifiedAt: 1, gameId: 1 }, { name: 'rentals_owner_notification_idx' }),

    chats.createIndex({ participants: 1, gameId: 1 }, { name: 'chats_participants_game_idx' }),
    messages.createIndex({ chatId: 1, createdAt: -1 }, { name: 'messages_chat_createdAt_idx' })
  ]);

  indexesEnsured = true;
}