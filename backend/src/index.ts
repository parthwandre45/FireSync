import http from 'http';
import fs from 'fs';
import { app } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkDatabaseConnection } from './db/prisma';
import { initializeScheduler } from './jobs/scheduler';

const UNIX_SOCKET_PATH = '/tmp/firesync.sock';

async function bootstrap() {
  logger.info('==============================================');
  logger.info('FIRESYNC BACKEND PLATFORM INITIALIZING...');
  logger.info('==============================================');

  // Verify PostgreSQL Connectivity
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.ok) {
    logger.info(`PostgreSQL Database connected successfully (${dbHealth.latencyMs}ms latency)`);
  } else {
    logger.error(`PostgreSQL connection failed: ${dbHealth.error}`);
  }

  // Initialize Background Sync Cron
  initializeScheduler();

  // 1. TCP Server (for Host & Vite proxy)
  const tcpServer = http.createServer(app);
  tcpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`FireSync REST API running on http://0.0.0.0:${env.PORT}`);
    logger.info(`Swagger API Documentation: http://localhost:${env.PORT}/api/docs`);
    logger.info(`Health check endpoint: http://localhost:${env.PORT}/api/v1/system/health`);
  });

  // 2. Unix Domain Socket Server (for cross-sandbox access on POSIX systems)
  let socketServer: http.Server | null = null;
  if (process.platform !== 'win32') {
    if (fs.existsSync(UNIX_SOCKET_PATH)) {
      try {
        fs.unlinkSync(UNIX_SOCKET_PATH);
      } catch (e) {
        // ignore
      }
    }

    socketServer = http.createServer(app);
    socketServer.listen(UNIX_SOCKET_PATH, () => {
      try {
        fs.chmodSync(UNIX_SOCKET_PATH, '0777');
      } catch (e) {
        // ignore
      }
      logger.info(`FireSync IPC Socket listening on ${UNIX_SOCKET_PATH}`);
    });
  }

  const shutdown = async () => {
    logger.info('Gracefully shutting down FireSync backend...');
    tcpServer.close();
    if (socketServer) {
      socketServer.close(() => {
        if (fs.existsSync(UNIX_SOCKET_PATH)) {
          try {
            fs.unlinkSync(UNIX_SOCKET_PATH);
          } catch (e) {
            // ignore
          }
        }
        logger.info('HTTP & Socket servers closed.');
        process.exit(0);
      });
    } else {
      logger.info('HTTP server closed.');
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error(`Fatal bootstrap error: ${err}`);
  process.exit(1);
});
