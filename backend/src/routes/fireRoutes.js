const express = require('express');
const {
  getPipelineStatus,
  triggerHarmonization,
  executePipeline,
  triggerHarmonizeFromDb,
  triggerFirmsIngestion,
  getIngestionStatus,
  getLiveFires,
  getCalendarData,
  getHistoricalAnalytics,
  getRegionalComparison,
  exportHistoricalCsv,
  getSampleObservations,
} = require('../controllers/fireController');

const router = express.Router();

// Pipeline & Harmonization routes
router.get('/status', getPipelineStatus);
router.post('/harmonize', triggerHarmonization);
router.post('/pipeline', executePipeline);
router.post('/from-db', triggerHarmonizeFromDb);

// Real NASA FIRMS Ingestion & Live Query routes
router.post('/ingest', triggerFirmsIngestion);
router.get('/live/status', getIngestionStatus);
router.get('/live', getLiveFires);
router.get('/calendar', getCalendarData);

// Phase 7: Historical Analysis, Regional Comparison & CSV Export routes
router.get('/historical', getHistoricalAnalytics);
router.get('/historical/compare', getRegionalComparison);
router.get('/historical/export', exportHistoricalCsv);

// Sample fallback route
router.get('/sample', getSampleObservations);

module.exports = router;
