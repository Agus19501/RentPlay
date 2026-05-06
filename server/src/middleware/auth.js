import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autorizado.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'rentplay-dev-secret');
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, message: 'Sesion invalida.' });
  }
}