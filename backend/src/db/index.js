const { Pool } = require('pg');
const config = require('../config');

// PostgreSQL Connection Pool
const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected client error', err.message);
});

/**
 * Health check utility for PostgreSQL & PostGIS
 */
const checkDbHealth = async () => {
  try {
    const client = await pool.connect();
    try {
      const resVersion = await client.query('SELECT version();');
      let postgisVersion = 'Not installed or not enabled';
      try {
        const resPostGis = await client.query('SELECT PostGIS_Version();');
        postgisVersion = resPostGis.rows[0].postgis_version;
      } catch (err) {
        // PostGIS extension might not be enabled yet
        postgisVersion = `PostGIS not active: ${err.message}`;
      }

      return {
        status: 'connected',
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        postgresVersion: resVersion.rows[0].version,
        postgisVersion,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      status: 'disconnected',
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      error: error.message,
      note: 'Database server may be offline or credentials need setup in .env',
    };
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  checkDbHealth,
};
