const axios = require('axios');
const config = require('../config');

/**
 * HTTP Client tailored for Python FastAPI Scientific Processing Service
 */
const fastApiClient = axios.create({
  baseURL: config.fastapi.baseUrl,
  timeout: config.fastapi.timeoutMs || 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'FireSync-Express-Gateway/2.0',
  },
});

/**
 * Pings FastAPI health endpoint
 */
const checkFastApiHealth = async () => {
  const startTime = Date.now();
  try {
    const response = await fastApiClient.get('/health');
    const latencyMs = Date.now() - startTime;
    return {
      status: 'connected',
      latencyMs,
      endpoint: `${config.fastapi.baseUrl}/health`,
      data: response.data,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return {
      status: 'disconnected',
      latencyMs,
      endpoint: `${config.fastapi.baseUrl}/health`,
      error: error.message,
      code: error.code || 'ECONNREFUSED',
      note: 'FastAPI service might not be running yet. Start it with `npm run dev:fastapi`',
    };
  }
};

/**
 * Executes full 5-stage scientific harmonization pipeline
 * (Stages 1 to 5: Standardization -> Spatial Grid -> Temporal Matching -> Calibration -> Daily Activity)
 */
const executeHarmonizationPipeline = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/pipeline', payload);
  return response.data;
};

/**
 * Triggers harmonization directly from PostgreSQL normalized_fires table
 */
const harmonizeFromDb = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/from-db', payload);
  return response.data;
};

/**
 * Legacy harmonization endpoint for backward compatibility
 */
const triggerHarmonization = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/process', payload);
  return response.data;
};

/**
 * Calls FastAPI satellite pipeline status and parameter definitions
 */
const getHarmonizerPipelineStatus = async () => {
  const response = await fastApiClient.get('/api/v1/harmonize/status');
  return response.data;
};

/**
 * Standalone Stage 1: Standardization & UTC normalization
 */
const standardizeObservations = async (records) => {
  const response = await fastApiClient.post('/api/v1/harmonize/standardize', { observations: records });
  return response.data;
};

/**
 * Standalone Stage 2: Equal-Area Spatial Grid assignment
 */
const assignSpatialGrid = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/spatial-grid', payload);
  return response.data;
};

/**
 * Standalone Stage 3: Temporal Matching
 */
const matchTemporally = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/temporal-match', payload);
  return response.data;
};

/**
 * Standalone Stage 4: Cross-Sensor Calibration
 */
const calibrateSensors = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/calibrate', payload);
  return response.data;
};

/**
 * Standalone Stage 5: Daily Activity Aggregation
 */
const generateDailyActivity = async (payload) => {
  const response = await fastApiClient.post('/api/v1/harmonize/daily-activity', payload);
  return response.data;
};

module.exports = {
  fastApiClient,
  checkFastApiHealth,
  executeHarmonizationPipeline,
  harmonizeFromDb,
  triggerHarmonization,
  getHarmonizerPipelineStatus,
  standardizeObservations,
  assignSpatialGrid,
  matchTemporally,
  calibrateSensors,
  generateDailyActivity,
};
