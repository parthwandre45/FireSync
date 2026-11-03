const {
  triggerHarmonization: callFastApiHarmonize,
  getHarmonizerPipelineStatus,
  executeHarmonizationPipeline,
  harmonizeFromDb: callHarmonizeFromDb,
} = require('../services/fastapiClient');
const firmsService = require('../services/firmsIngestionService');

/**
 * Controller for fire observations & harmonization pipelines
 */
const getPipelineStatus = async (req, res, next) => {
  try {
    const status = await getHarmonizerPipelineStatus();
    res.json({
      success: true,
      service: 'FireSync API Gateway',
      pipeline: status,
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'FastAPI scientific service currently offline or unreachable',
      error: error.message,
      fallbackConfig: {
        sensors: ['MODIS_TERRA', 'MODIS_AQUA', 'VIIRS_NPP', 'VIIRS_NOAA20', 'VIIRS_NOAA21'],
        nominalResolutions: { MODIS: '1000m', VIIRS: '375m' },
      },
    });
  }
};

const triggerHarmonization = async (req, res, next) => {
  try {
    const payload = req.body || {
      region_name: 'India Indo-Gangetic Plain',
      start_date: '2026-10-24',
      end_date: '2026-10-31',
      spatial_threshold_km: 1.5,
      temporal_threshold_days: 2,
    };

    const result = await callFastApiHarmonize(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Executes full 5-stage scientific harmonization pipeline
 */
const executePipeline = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await executeHarmonizationPipeline(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers harmonization pulling directly from PostgreSQL normalized_fires
 */
const triggerHarmonizeFromDb = async (req, res, next) => {
  try {
    const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {
      region_name: req.query.region || 'India Regional Corridor',
      country_code: req.query.country || 'IND',
      start_date: req.query.start_date || null,
      end_date: req.query.end_date || null,
      persist_to_db: req.query.persist !== 'false',
    };
    const result = await callHarmonizeFromDb(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Triggers on-demand real NASA FIRMS active-fire ingestion into PostgreSQL
 */
const triggerFirmsIngestion = async (req, res, next) => {
  try {
    const options = {
      targetRegion: req.body.country || 'IND',
      days: parseInt(req.body.days || '7', 10),
    };

    const result = await firmsService.runIngestionPipeline(options);
    res.json({
      success: true,
      message: `NASA FIRMS active fire ingestion completed successfully for ${options.targetRegion}`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves summary statistics and history of NASA FIRMS ingestion runs
 */
const getIngestionStatus = async (req, res, next) => {
  try {
    const country = req.query.country || 'IND';
    const stats = await firmsService.getLiveFireStats({ country });
    res.json({
      success: true,
      dataSource: 'NASA FIRMS (LANCE/EOSDIS) & PostgreSQL / PostGIS',
      isLive: true,
      ...stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Queries real normalized NASA active fire detections from PostgreSQL
 */
const getLiveFires = async (req, res, next) => {
  try {
    const options = {
      country: req.query.country || 'IND',
      sensor: req.query.sensor,
      minFrp: parseFloat(req.query.minFrp || '0'),
      confidence: req.query.confidence,
      startDate: req.query.startDate || req.query.start_date,
      endDate: req.query.endDate || req.query.end_date,
      minLat: req.query.minLat !== undefined ? parseFloat(req.query.minLat) : undefined,
      maxLat: req.query.maxLat !== undefined ? parseFloat(req.query.maxLat) : undefined,
      minLon: req.query.minLon !== undefined ? parseFloat(req.query.minLon) : undefined,
      maxLon: req.query.maxLon !== undefined ? parseFloat(req.query.maxLon) : undefined,
      limit: parseInt(req.query.limit || '1000', 10),
      offset: parseInt(req.query.offset || '0', 10),
    };

    const result = await firmsService.getLiveFires(options);
    res.json({
      success: true,
      dataSource: 'LIVE NASA FIRMS ACTIVE FIRE DATABASE',
      country: options.country,
      count: result.records.length,
      filters: options,
      pagination: result.pagination,
      matchingStats: result.matchingStats,
      records: result.records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Phase 6: Retrieves interactive burning activity calendar data from PostgreSQL and harmonization engine
 */
const getCalendarData = async (req, res, next) => {
  try {
    const options = {
      country: req.query.country || 'IND',
      year: parseInt(req.query.year || '2026', 10),
      month: parseInt(req.query.month || '10', 10),
      regionName: req.query.regionName || 'All India',
      minLat: req.query.minLat !== undefined ? parseFloat(req.query.minLat) : undefined,
      maxLat: req.query.maxLat !== undefined ? parseFloat(req.query.maxLat) : undefined,
      minLon: req.query.minLon !== undefined ? parseFloat(req.query.minLon) : undefined,
      maxLon: req.query.maxLon !== undefined ? parseFloat(req.query.maxLon) : undefined,
    };

    const calendarResult = await firmsService.getCalendarData(options);
    res.json(calendarResult);
  } catch (error) {
    next(error);
  }
};

/**
 * Phase 7: Retrieves multi-day/multi-month historical fire analytics and research intelligence
 */
const getHistoricalAnalytics = async (req, res, next) => {
  try {
    const options = {
      country: req.query.country || 'IND',
      startDate: req.query.startDate || req.query.start_date || '2026-10-01',
      endDate: req.query.endDate || req.query.end_date || '2026-11-30',
      regionName: req.query.regionName || req.query.region || 'All India',
      stateId: req.query.stateId || req.query.state || 'ALL',
      minLat: req.query.minLat !== undefined ? parseFloat(req.query.minLat) : undefined,
      maxLat: req.query.maxLat !== undefined ? parseFloat(req.query.maxLat) : undefined,
      minLon: req.query.minLon !== undefined ? parseFloat(req.query.minLon) : undefined,
      maxLon: req.query.maxLon !== undefined ? parseFloat(req.query.maxLon) : undefined,
      confidence: req.query.confidence,
      minFrp: req.query.minFrp !== undefined ? parseFloat(req.query.minFrp) : 0,
    };

    const result = await firmsService.getHistoricalAnalytics(options);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Phase 7: Side-by-side regional comparison of two Indian states
 */
const getRegionalComparison = async (req, res, next) => {
  try {
    const options = {
      stateA: req.query.stateA || req.query.regionA || 'PB',
      stateB: req.query.stateB || req.query.regionB || 'HR',
      startDate: req.query.startDate || '2026-10-26',
      endDate: req.query.endDate || '2026-11-03',
    };

    const result = await firmsService.getRegionalComparison(options);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Phase 7: Functional CSV Export for observations, daily summaries, and regional summaries
 */
const exportHistoricalCsv = async (req, res, next) => {
  try {
    const options = {
      type: req.query.type || 'daily_summary', // 'daily_summary', 'observations', 'regional_summary'
      country: req.query.country || 'IND',
      startDate: req.query.startDate || req.query.start_date || '2026-10-26',
      endDate: req.query.endDate || req.query.end_date || '2026-11-03',
      sensor: req.query.sensor,
      minLat: req.query.minLat !== undefined ? parseFloat(req.query.minLat) : undefined,
      maxLat: req.query.maxLat !== undefined ? parseFloat(req.query.maxLat) : undefined,
      minLon: req.query.minLon !== undefined ? parseFloat(req.query.minLon) : undefined,
      maxLon: req.query.maxLon !== undefined ? parseFloat(req.query.maxLon) : undefined,
      limit: parseInt(req.query.limit || '10000', 10),
    };

    const csvContent = await firmsService.generateHistoricalCsv(options);
    const filename = `FireSync_${options.country}_${options.type}_${options.startDate}_to_${options.endDate}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Returns demo observations for fallback reference
 */
const getSampleObservations = (req, res) => {
  res.json({
    success: true,
    isDemo: true,
    metadata: {
      title: 'NASA Active Fire Multi-Sensor Observations (DEMO DATA)',
      region: 'Yosemite / Sierra Nevada Corridor',
      timeframe: 'August 2026',
    },
    modis: [
      { id: 'M-1', lat: 37.7749, lon: -119.5383, brightness: 335.4, frp: 45.8, satellite: 'Aqua', confidence: 85, acq_date: '2026-08-15' },
      { id: 'M-2', lat: 37.7812, lon: -119.5420, brightness: 342.1, frp: 62.3, satellite: 'Aqua', confidence: 92, acq_date: '2026-08-15' },
      { id: 'M-3', lat: 37.7650, lon: -119.5290, brightness: 328.0, frp: 38.0, satellite: 'Terra', confidence: 78, acq_date: '2026-08-15' },
    ],
    viirs: [
      { id: 'V-1', lat: 37.7748, lon: -119.5381, brightness: 355.2, frp: 49.2, satellite: 'Suomi-NPP', confidence: 'high', acq_date: '2026-08-15' },
      { id: 'V-2', lat: 37.7770, lon: -119.5395, brightness: 348.6, frp: 41.0, satellite: 'Suomi-NPP', confidence: 'nominal', acq_date: '2026-08-15' },
      { id: 'V-3', lat: 37.7805, lon: -119.5415, brightness: 362.8, frp: 68.4, satellite: 'Suomi-NPP', confidence: 'high', acq_date: '2026-08-15' },
    ],
    harmonizedCalendar: [
      { date: '2026-08-12', modisFrp: 12.4, viirsFrp: 18.2, totalFrp: 30.6, burnedAreaHa: 480 },
      { date: '2026-08-13', modisFrp: 35.8, viirsFrp: 48.0, totalFrp: 83.8, burnedAreaHa: 1320 },
      { date: '2026-08-14', modisFrp: 88.5, viirsFrp: 112.4, totalFrp: 200.9, burnedAreaHa: 3170 },
      { date: '2026-08-15', modisFrp: 146.1, viirsFrp: 158.6, totalFrp: 304.7, burnedAreaHa: 4810 },
      { date: '2026-08-16', modisFrp: 95.2, viirsFrp: 104.1, totalFrp: 199.3, burnedAreaHa: 3140 },
      { date: '2026-08-17', modisFrp: 42.0, viirsFrp: 51.3, totalFrp: 93.3, burnedAreaHa: 1470 },
      { date: '2026-08-18', modisFrp: 15.1, viirsFrp: 19.8, totalFrp: 34.9, burnedAreaHa: 550 },
    ],
  });
};

module.exports = {
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
};
