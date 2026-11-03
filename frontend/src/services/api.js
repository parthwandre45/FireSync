import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchCompositeHealth = async () => {
  const startTime = Date.now();
  try {
    const res = await api.get('/api/health');
    return {
      success: true,
      data: res.data,
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      latency: Date.now() - startTime,
    };
  }
};

/**
 * Retrieves real active fire stats from PostgreSQL (NASA FIRMS ingestion)
 */
export const fetchLiveFireStats = async (country = 'IND') => {
  try {
    const res = await api.get(`/api/fires/live/status?country=${country}`);
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Retrieves real normalized NASA active fire detections from PostgreSQL
 */
export const fetchLiveFires = async (params = {}) => {
  try {
    const res = await api.get('/api/fires/live', { params });
    return res.data;
  } catch (error) {
    return { success: false, error: error.message, records: [] };
  }
};

/**
 * Triggers on-demand NASA FIRMS data ingestion in backend
 */
export const triggerLiveFirmsIngest = async (country = 'IND', days = 7) => {
  try {
    const res = await api.post('/api/fires/ingest', { country, days });
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const fetchSampleObservations = async () => {
  try {
    const res = await api.get('/api/fires/sample');
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const triggerHarmonizationRun = async (params) => {
  const res = await api.post('/api/fires/harmonize', params);
  return res.data;
};

/**
 * Triggers full 5-stage scientific harmonization pipeline
 */
export const fetchHarmonizationPipeline = async (payload) => {
  const res = await api.post('/api/fires/pipeline', payload);
  return res.data;
};

/**
 * Triggers harmonization directly pulling observations from PostgreSQL normalized_fires
 */
export const fetchHarmonizationFromDb = async (payload = {}) => {
  const res = await api.post('/api/fires/from-db', payload);
  return res.data;
};

/**
 * Phase 6: Retrieves interactive burning activity calendar data
 */
export const fetchBurningCalendar = async (params = {}) => {
  try {
    const res = await api.get('/api/fires/calendar', { params });
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Phase 7: Retrieves comprehensive historical fire analytics, time series & research intelligence
 */
export const fetchHistoricalAnalytics = async (params = {}) => {
  try {
    const res = await api.get('/api/fires/historical', { params });
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Phase 7: Retrieves side-by-side regional comparison for two Indian states
 */
export const fetchRegionalComparison = async (params = {}) => {
  try {
    const res = await api.get('/api/fires/historical/compare', { params });
    return res.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Phase 7: Returns direct URL for CSV dataset export
 */
export const getHistoricalExportUrl = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseURL}/api/fires/historical/export?${query}`;
};

/**
 * Retrieves scientific pipeline status, specs and guardrails
 */
export const fetchPipelineStatus = async () => {
  const res = await api.get('/api/fires/status');
  return res.data;
};

export default api;
