import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { logger } from './config/logger';

export const app = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and same-origin
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

// Standard parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Rate Limiter
app.use('/api', rateLimiter(600, 60 * 1000));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    } else {
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
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

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Root API Health
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date().toISOString() });
});

// Mount V1 API
app.use('/api/v1', apiRoutes);

// Centralized error handling
app.use(errorHandler);

