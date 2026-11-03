require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  firms: {
    mapKey: process.env.NASA_FIRMS_MAP_KEY || '',
    baseUrl: process.env.NASA_FIRMS_BASE_URL || 'https://firms.modaps.eosdis.nasa.gov',
    timeoutMs: 30000,
  },
  fastapi: {
    baseUrl: process.env.FASTAPI_SERVICE_URL || 'http://127.0.0.1:8000',
    timeoutMs: parseInt(process.env.FASTAPI_TIMEOUT_MS || '8000', 10),
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'firesync_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
};
