const { getMongoClient } = require('./config');

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

  const updates = {};
  // allow updating these fields
  const allowed = ['name', 'apodo', 'fechaNacimiento', 'correo'];
  for (const key of allowed) {
    const v = body.get(key);
    if (v !== null) updates[key] = v;
  }

  if (Object.keys(updates).length === 0) {
    return {
      statusCode: 422,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, message: 'No hay campos para actualizar.' }),
    };
  }

  let client;
  try {
    client = await getMongoClient();
    const db = client.db();
    const res = await db.collection('users').updateOne({ email }, { $set: updates });

    if (res.matchedCount === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: false, message: 'Usuario no encontrado.' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, message: 'Usuario actualizado.' }),
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
