"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.checkDatabaseConnection = checkDatabaseConnection;
const client_1 = require("@prisma/client");
const logger_1 = require("../config/logger");
exports.prisma = global.__prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? [
                { emit: 'event', level: 'query' },
                { emit: 'stdout', level: 'error' },
                { emit: 'stdout', level: 'warn' }
            ]
            : ['error']
    });
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = exports.prisma;
}
// Log queries in development
if (process.env.NODE_ENV === 'development') {
    // @ts-expect-error prisma query event
    exports.prisma.$on('query', (e) => {
        if (e.duration > 200) {
            logger_1.logger.warn(`Slow Query (${e.duration}ms): ${e.query}`);
        }
    });
}
async function checkDatabaseConnection() {
    const start = Date.now();
    try {
        await exports.prisma.$queryRaw `SELECT 1`;
        return { ok: true, latencyMs: Date.now() - start };
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown DB connection error';
        logger_1.logger.error(`Database connection check failed: ${msg}`);
        return { ok: false, latencyMs: Date.now() - start, error: msg };
    }
}
