"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimiter_1 = require("./middleware/rateLimiter");
const logger_1 = require("./config/logger");
exports.app = (0, express_1.default)();
// Security headers
exports.app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
// CORS configuration
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow local development and same-origin
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        }
        else {
            callback(null, true);
        }
    },
    credentials: true
}));
// Standard parsers
exports.app.use(express_1.default.json({ limit: '5mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
exports.app.use((0, cookie_parser_1.default)());
// Rate Limiter
exports.app.use('/api', (0, rateLimiter_1.rateLimiter)(600, 60 * 1000));
// Request logging middleware
exports.app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            logger_1.logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        }
        else {
            logger_1.logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
        }
    });
    next();
});
// Swagger API Documentation Definition
const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'FireSync API - NASA Wildfire Intelligence Platform',
        version: '1.0.0',
        description: 'REST API services for global wildfire observation, thermal anomalies, satellite missions, and geographic analytics.'
    },
    servers: [{ url: '/api/v1', description: 'FireSync V1 Production & Local Server' }],
    paths: {
        '/dashboard/overview': {
            get: {
                summary: 'Get global dashboard overview metrics',
                responses: { '200': { description: 'Overview statistics' } }
            }
        },
        '/fires': {
            get: {
                summary: 'Filter and query active fire observations',
                parameters: [
                    { name: 'minLat', in: 'query', schema: { type: 'number' } },
                    { name: 'maxLat', in: 'query', schema: { type: 'number' } },
                    { name: 'minLon', in: 'query', schema: { type: 'number' } },
                    { name: 'maxLon', in: 'query', schema: { type: 'number' } },
                    { name: 'confidence', in: 'query', schema: { type: 'number' } },
                    { name: 'minFrp', in: 'query', schema: { type: 'number' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer' } }
                ],
                responses: { '200': { description: 'List of fire observations' } }
            }
        },
        '/fires/nearby': {
            get: {
                summary: 'Geospatial proximity search around lat/lon',
                parameters: [
                    { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'lon', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'radiusKm', in: 'query', schema: { type: 'number', default: 100 } }
                ],
                responses: { '200': { description: 'Fires within radius' } }
            }
        },
        '/incidents': {
            get: {
                summary: 'List fire incidents and spatial clusters',
                responses: { '200': { description: 'List of incidents' } }
            }
        },
        '/satellites': {
            get: {
                summary: 'List satellite missions with real-time status',
                responses: { '200': { description: 'List of missions' } }
            }
        },
        '/weather/nearby': {
            get: {
                summary: 'Get current atmospheric conditions near coordinates',
                parameters: [
                    { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
                    { name: 'lon', in: 'query', required: true, schema: { type: 'number' } }
                ],
                responses: { '200': { description: 'Atmospheric conditions' } }
            }
        },
        '/system/health': {
            get: {
                summary: 'Health check and database telemetry',
                responses: { '200': { description: 'System health summary' } }
            }
        }
    }
};
exports.app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openApiSpec));
// Root API Health
exports.app.get('/health', (req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});
// Mount V1 API
exports.app.use('/api/v1', routes_1.default);
// Centralized error handling
exports.app.use(errorHandler_1.errorHandler);
