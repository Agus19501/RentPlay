import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import gamesRoutes from './routes/games.js';
import rentalsRoutes from './routes/rentals.js';
import { seedGamesIfNeeded } from './config/db.js';

const app = express();
const port = Number(process.env.PORT || 4000);

const corsOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'RentPlay API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/rentals', rentalsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
});

await seedGamesIfNeeded();

app.listen(port, () => {
  console.log(`RentPlay API listening on http://localhost:${port}`);
});