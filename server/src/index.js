import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import gamesRoutes from './routes/games.js';
import messagesRoutes from './routes/messages.js';
import rentalsRoutes from './routes/rentals.js';
import chatsRoutes from './routes/chats.js';
import chatsReadRoutes from './routes/chats-read.js';
import { ensureIndexes, seedGamesIfNeeded } from './config/db.js';

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'RentPlay API running' });
});

// Endpoint para descargar imágenes desde URLs externas (para evitar CORS issues)
app.post('/api/download-image', async (req, res) => {
  const { url } = req.body;
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ ok: false, message: 'URL inválida' });
  }
  
  try {
    // Validar que la URL sea de RAWG
    if (!url.includes('media.rawg.io')) {
      return res.status(400).json({ ok: false, message: 'Solo se permiten imágenes de RAWG' });
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(400).json({ ok: false, message: 'Error descargando imagen' });
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    res.json({ ok: true, imageData: `data:image/jpeg;base64,${base64}` });
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({ ok: false, message: 'Error descargando imagen' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatsReadRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/rentals', rentalsRoutes);
app.use('/api/chats', chatsRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ ok: false, message: 'Error interno del servidor.' });
});

await ensureIndexes();
await seedGamesIfNeeded();

app.listen(port, () => {
  console.log(`RentPlay API listening on http://localhost:${port}`);

  if (process.env.WARMUP_HOME_CACHE === '1') {
    // Opcional: solo activar en entornos donde el warmup esté controlado.
    setTimeout(async () => {
      try {
        await Promise.all([
          fetch(`http://localhost:${port}/api/games?lite=1`),
          fetch(`http://localhost:${port}/api/games`)
        ]);
        console.log('Games listing cache warmed.');
      } catch (error) {
        console.warn('Could not warm games cache on startup:', error.message);
      }
    }, 250);
  }
});