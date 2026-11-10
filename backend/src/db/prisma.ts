import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' }
          ]
        : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error prisma query event
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn(`Slow Query (${e.duration}ms): ${e.query}`);
    }
  });
}

export async function checkDatabaseConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown DB connection error';
    logger.error(`Database connection check failed: ${msg}`);
    return { ok: false, latencyMs: Date.now() - start, error: msg };
  }
}

