const { getMongoClient, mongoFindOne, mongoInsertOne } = require('./config');
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
  const name = (body.get('name') || '').trim();
  const password = body.get('password') || '';

  if (!email.includes('@') || !email.includes('.')) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Correo invalido.' }),
    };
  }

  if (name.length < 2) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Nombre demasiado corto.' }),
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'La contrasena debe tener al menos 6 caracteres.' }),
    };
  }

  let client;
  try {
    client = await getMongoClient();
    const existingUser = await mongoFindOne(client, 'users', { email });

    if (existingUser) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Este correo ya esta registrado.' }),
      };
    }

    const passwordHash = hashPassword(password);
    const insertedId = await mongoInsertOne(client, 'users', {
      name,
      email,
      password_hash: passwordHash,
      created_at: new Date(),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Cuenta creada correctamente.',
        user: {
          id: insertedId,
          name,
          email,
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
        message: 'Error al crear la cuenta.',
        error: error.message,
      }),
    };
  } finally {
    if (client) await client.close();
  }
};
