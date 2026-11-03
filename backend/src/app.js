const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const healthRoutes = require('./routes/healthRoutes');
const fireRoutes = require('./routes/fireRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root Gateway info
app.get('/', (req, res) => {
  res.json({
    project: 'FireSync – Unified Satellite Fire Intelligence',
    challenge: 'NASA Space Apps Challenge 2026',
    role: 'Express.js API Gateway & Orchestrator',
    endpoints: {
      health: '/api/health',
      fastapiHealth: '/api/health/fastapi',
      databaseHealth: '/api/health/db',
      firePipelineStatus: '/api/fires/status',
      sampleFireData: '/api/fires/sample',
    },
  });
});

// Mount Routes
app.use('/api/health', healthRoutes);
app.use('/api/fires', fireRoutes);

// Fallbacks & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
