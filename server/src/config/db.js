import { MongoClient } from 'mongodb';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'rentplay';

let clientPromise;

function getRootPath() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../');
}

export async function getDb() {
  if (!clientPromise) {
    const client = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    clientPromise = client.connect();
  }

  const client = await clientPromise;
  return client.db(databaseName);
}

export async function getCollections() {
  const db = await getDb();
  return {
    db,
    users: db.collection('users'),
    games: db.collection('games'),
    rentals: db.collection('rentals')
  };
}

export async function seedGamesIfNeeded() {
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
}