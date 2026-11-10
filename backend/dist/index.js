"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const prisma_1 = require("./db/prisma");
const scheduler_1 = require("./jobs/scheduler");
const UNIX_SOCKET_PATH = '/tmp/firesync.sock';
async function bootstrap() {
    logger_1.logger.info('==============================================');
    logger_1.logger.info('FIRESYNC BACKEND PLATFORM INITIALIZING...');
    logger_1.logger.info('==============================================');
    // Verify PostgreSQL Connectivity
    const dbHealth = await (0, prisma_1.checkDatabaseConnection)();
    if (dbHealth.ok) {
        logger_1.logger.info(`PostgreSQL Database connected successfully (${dbHealth.latencyMs}ms latency)`);
    }
    else {
        logger_1.logger.error(`PostgreSQL connection failed: ${dbHealth.error}`);
    }
    // Initialize Background Sync Cron
    (0, scheduler_1.initializeScheduler)();
    // 1. TCP Server (for Host & Vite proxy)
    const tcpServer = http_1.default.createServer(app_1.app);
    tcpServer.listen(env_1.env.PORT, '0.0.0.0', () => {
        logger_1.logger.info(`FireSync REST API running on http://0.0.0.0:${env_1.env.PORT}`);
        logger_1.logger.info(`Swagger API Documentation: http://localhost:${env_1.env.PORT}/api/docs`);
        logger_1.logger.info(`Health check endpoint: http://localhost:${env_1.env.PORT}/api/v1/system/health`);
    });
    // 2. Unix Domain Socket Server (for cross-sandbox access)
    if (fs_1.default.existsSync(UNIX_SOCKET_PATH)) {
        try {
            fs_1.default.unlinkSync(UNIX_SOCKET_PATH);
        }
        catch (e) {
            // ignore
        }
    }
    const socketServer = http_1.default.createServer(app_1.app);
    socketServer.listen(UNIX_SOCKET_PATH, () => {
        try {
            fs_1.default.chmodSync(UNIX_SOCKET_PATH, '0777');
        }
        catch (e) {
            // ignore
        }
        logger_1.logger.info(`FireSync IPC Socket listening on ${UNIX_SOCKET_PATH}`);
    });
    const shutdown = async () => {
        logger_1.logger.info('Gracefully shutting down FireSync backend...');
        tcpServer.close();
        socketServer.close(() => {
            if (fs_1.default.existsSync(UNIX_SOCKET_PATH)) {
                try {
                    fs_1.default.unlinkSync(UNIX_SOCKET_PATH);
                }
                catch (e) {
                    // ignore
                }
            }
            logger_1.logger.info('HTTP & Socket servers closed.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
bootstrap().catch((err) => {
    logger_1.logger.error(`Fatal bootstrap error: ${err}`);
    process.exit(1);
});
