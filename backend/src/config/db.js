const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no esta definido en variables de entorno');
  }

  await mongoose.connect(uri);
}

module.exports = connectDB;
