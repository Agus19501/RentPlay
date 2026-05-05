const { getMongoClient, mongoFindOne } = require('./config');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Metodo no permitido.' }),
    };
  }

  const body = new URLSearchParams(event.body);
  const email = (body.get('email') || '').trim();
  const password = body.get('password') || '';

  if (!email.includes('@') || !email.includes('.')) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Correo invalido.' }),
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Contrasena invalida.' }),
    };
  }

  let client;
  try {
    client = await getMongoClient();
    const user = await mongoFindOne(client, 'users', { email });

    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Credenciales incorrectas.' }),
      };
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.password_hash) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Credenciales incorrectas.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Sesion iniciada correctamente.',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        message: 'Error al iniciar sesion.',
        error: error.message,
      }),
    };
  } finally {
    if (client) await client.close();
  }
};
