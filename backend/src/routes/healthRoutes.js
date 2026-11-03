const express = require('express');
const {
  getHealthStatus,
  getFastApiHealth,
  getDatabaseHealth,
} = require('../controllers/healthController');

const router = express.Router();

// Composite Health Check (Express + FastAPI + PostGIS)
router.get('/', getHealthStatus);

// Specialized Sub-checks
router.get('/fastapi', getFastApiHealth);
router.get('/db', getDatabaseHealth);

module.exports = router;
