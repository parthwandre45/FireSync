"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load .env
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().default('postgresql://postgres@localhost:5433/firesync?host=/tmp'),
    JWT_SECRET: zod_1.z.string().min(8).default('firesync_jwt_operations_key_dev_token_secret_8492049'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    NASA_FIRMS_MAP_KEY: zod_1.z.string().optional().default(''),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:5173'),
    INGESTION_CRON: zod_1.z.string().default('*/15 * * * *'),
    LOG_LEVEL: zod_1.z.string().default('info')
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Environment configuration error');
}
exports.env = parsed.data;
