const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    client.on('error', (err) => {
      console.error('Error de Redis:', err);
    });

    client.on('connect', () => {
      console.log('✅ Conectado a Redis');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Error al conectar a Redis:', error);
    throw error;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Cliente Redis no inicializado');
  }
  return client;
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    console.log('✅ Conexión a Redis cerrada');
  }
};

module.exports = {
  connectRedis,
  getClient,
  closeRedis
}; 