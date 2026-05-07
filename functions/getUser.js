const { getMongoClient, mongoFindOne } = require('./config');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Metodo no permitido.' }),
    };
  }

  const body = new URLSearchParams(event.body || '');
  const email = (body.get('email') || '').trim();

  if (!email) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Falta email.' }),
    };
  }

  let client;
  try {
    client = await getMongoClient();
    const user = await mongoFindOne(client, 'users', { email });

    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Usuario no encontrado.' }),
      };
    }

    // Remove sensitive fields if present
    if (user.password_hash) delete user.password_hash;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, user }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'Error del servidor.', error: error.message }),
    };
  } finally {
    if (client) await client.close();
  }
};
