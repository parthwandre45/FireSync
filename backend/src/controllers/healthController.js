const { checkDbHealth } = require('../db');
const { checkFastApiHealth } = require('../services/fastapiClient');

const startTime = Date.now();

/**
 * Composite Health Check Endpoint
 * Checks Express Gateway, FastAPI Python scientific service, and PostgreSQL database.
 */
const getHealthStatus = async (req, res, next) => {
  try {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Concurrently ping Database and FastAPI
    const [dbHealth, fastApiHealth] = await Promise.all([
      checkDbHealth(),
      checkFastApiHealth(),
    ]);

    const isHealthy = fastApiHealth.status === 'connected';

    res.status(isHealthy ? 200 : 207).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'FireSync Express API Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      dependencies: {
        express: {
          status: 'healthy',
          memoryUsage: process.memoryUsage(),
        },
        fastapiScientificService: fastApiHealth,
        postgreSQL: dbHealth,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct FastAPI Health Check Proxy
 */
const getFastApiHealth = async (req, res, next) => {
  try {
    const result = await checkFastApiHealth();
    res.status(result.status === 'connected' ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Direct Database Health Check
 */
const getDatabaseHealth = async (req, res, next) => {
  try {
    const result = await checkDbHealth();
    res.status(result.status === 'connected' ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus,
  getFastApiHealth,
  getDatabaseHealth,
};
