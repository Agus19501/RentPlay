const { getMongoClient } = require('./config');

exports.handler = async (event) => {
  let client;
  try {
    client = await getMongoClient();
    const admin = client.db('admin');
    await admin.command({ ping: 1 });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Conexion a MongoDB exitosa.',
        database: 'rentplay',
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: false,
        message: 'No se pudo conectar a la base de datos.',
        error: error.message,
      }),
    };
  } finally {
    if (client) await client.close();
  }
};
