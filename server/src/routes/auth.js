import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

const router = Router();

function createSession(user) {
  const token = jwt.sign(
    {
      sub: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET || 'rentplay-dev-secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

router.post('/register', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(422).json({ ok: false, message: 'Correo invalido.' });
    }

    if (name.length < 2) {
      return res.status(422).json({ ok: false, message: 'Nombre demasiado corto.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ ok: false, message: 'La contrasena debe tener al menos 6 caracteres.' });
    }

    const { users } = await getCollections();
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'Este correo ya esta registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date()
    });

    const session = createSession({
      _id: result.insertedId.toString(),
      name,
      email
    });

    return res.json({ ok: true, message: 'Cuenta creada correctamente.', session });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al crear la cuenta.', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email.includes('@') || !email.includes('.')) {
      return res.status(422).json({ ok: false, message: 'Correo invalido.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ ok: false, message: 'Contrasena invalida.' });
    }

    const { users } = await getCollections();
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales incorrectas.' });
    }

    return res.json({
      ok: true,
      message: 'Sesion iniciada correctamente.',
      session: createSession({
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      })
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al iniciar sesion.', error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No autorizado.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
    const { users } = await getCollections();
    const user = await users.findOne({ _id: new ObjectId(payload.sub) });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    return res.json({
      ok: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch {
    return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
  }
});

export default router;