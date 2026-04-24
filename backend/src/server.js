const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const rentalRoutes = require('./routes/rentals');

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    }
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'rentplay-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rentals', rentalRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado');
    }

    await connectDB();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`RentPlay API escuchando en puerto ${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

startServer();
