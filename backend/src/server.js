const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 FireSync Express API Gateway running on port ${config.port}`);
  console.log(`📡 Linked FastAPI Scientific Service: ${config.fastapi.baseUrl}`);
  console.log(`🗄️  PostgreSQL Target: ${config.db.host}:${config.db.port}/${config.db.database}`);
  console.log(`🩺 Health Check: http://localhost:${config.port}/api/health`);
  console.log('====================================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
