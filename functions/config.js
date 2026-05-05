const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'rentplay';

async function getMongoClient() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  return client;
}

async function mongoFindOne(client, collection, filter) {
  const db = client.db(DB_NAME);
  const result = await db.collection(collection).findOne(filter);
  if (result) {
    return {
      ...result,
      _id: result._id.toString(),
    };
  }
  return null;
}

async function mongoInsertOne(client, collection, document) {
  const db = client.db(DB_NAME);
  const result = await db.collection(collection).insertOne(document);
  return result.insertedId.toString();
}

module.exports = {
  getMongoClient,
  mongoFindOne,
  mongoInsertOne,
  DB_NAME,
};
