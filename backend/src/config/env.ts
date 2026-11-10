import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://postgres@localhost:5433/firesync?host=/tmp'),
  JWT_SECRET: z.string().min(8).default('firesync_jwt_operations_key_dev_token_secret_8492049'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  NASA_FIRMS_MAP_KEY: z.string().optional().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  INGESTION_CRON: z.string().default('*/15 * * * *'),
  LOG_LEVEL: z.string().default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration error');
}

export const env = parsed.data;

