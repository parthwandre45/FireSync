const axios = require('axios');
const db = require('../db');

async function runAllVerificationTests() {
  console.log('========================================================================');
  console.log('🔥 FIRESYNC COMPLETE PROJECT VERIFICATION SUITE (PHASES 1–7)');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // SUITE 1: System Health & Connectivity
    // ----------------------------------------------------
    console.log('--- SUITE 1: System Health & Service Connectivity ---');
    const healthRes = await axios.get('http://localhost:5000/api/health');
    assert(healthRes.status === 200, 'Express API Gateway responds on port 5000');
    assert(healthRes.data.dependencies.postgreSQL.status === 'connected', 'PostgreSQL database connected');
    assert(healthRes.data.dependencies.fastapiScientificService.status === 'connected', 'FastAPI Scientific Service connected on port 8000');

    // ----------------------------------------------------
    // SUITE 2: Real Database Ground Truth
    // ----------------------------------------------------
    console.log('\n--- SUITE 2: PostgreSQL Database Ground Truth ---');
    const countRes = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(*) FILTER (WHERE sensor = 'MODIS') as modis_count,
        COUNT(*) FILTER (WHERE sensor = 'VIIRS') as viirs_count,
        ROUND(SUM(frp_mw), 2) as total_frp
      FROM normalized_fires
      WHERE country_code = 'IND'
    `);
    const dbCounts = countRes.rows[0];
    const totalRecords = parseInt(dbCounts.total_records, 10);
    const modisCount = parseInt(dbCounts.modis_count, 10);
    const viirsCount = parseInt(dbCounts.viirs_count, 10);

    assert(totalRecords >= 24000, `Database contains real NASA records: ${totalRecords} active fires`);
    assert(modisCount >= 3300, `MODIS detections verified: ${modisCount}`);
    assert(viirsCount >= 21000, `VIIRS detections verified: ${viirsCount}`);

    // ----------------------------------------------------
    // SUITE 3: Live Hotspot Explorer Endpoints
    // ----------------------------------------------------
    console.log('\n--- SUITE 3: Geospatial Hotspot Explorer API ---');
    const liveRes = await axios.get('http://localhost:5000/api/fires/live?country=IND&limit=50');
    assert(liveRes.data.success === true, 'Live fires query responds successfully');
    assert(liveRes.data.count === 50, 'Pagination limit strictly enforced');
    assert(liveRes.data.matchingStats.totalMatching === totalRecords, `Total matching scope matches DB (${totalRecords})`);

    // ----------------------------------------------------
    // SUITE 4: Phase 6 Burning Activity Calendar
    // ----------------------------------------------------
    console.log('\n--- SUITE 4: Burning Activity Calendar ---');
    const calOctRes = await axios.get('http://localhost:5000/api/fires/calendar?year=2026&month=10');
    assert(calOctRes.data.success === true, 'October 2026 calendar responds successfully');
    assert(calOctRes.data.monthSummary.activeDaysMonitored === 6, 'October active monitored days = 6');
    assert(calOctRes.data.calendarDays.length === 31, 'Calendar contains full 31-day array');

    // Verify Oct 26 matched pairs
    const day26 = calOctRes.data.calendarDays.find(d => d.date === '2026-10-26');
    assert(day26.observationCounts.matchedObservationGroups === 2, 'October 26 has exactly 2 matched pairs');
    assert(day26.observationCounts.effectiveIndependentDetections === 3114, 'October 26 effective detections = 3,114');

    // Verify Oct 29 zero matches (physical divergence)
    const day29 = calOctRes.data.calendarDays.find(d => d.date === '2026-10-29');
    assert(day29.observationCounts.matchedObservationGroups === 0, 'October 29 has 0 matched pairs (verified orbital separation >= 113 min)');

    // ----------------------------------------------------
    // SUITE 5: Phase 7 Historical Analysis & Research Intelligence
    // ----------------------------------------------------
    console.log('\n--- SUITE 5: Historical Analysis, Anomaly Engine & Ratios ---');
    const histRes = await axios.get('http://localhost:5000/api/fires/historical?startDate=2026-10-26&endDate=2026-11-03');
    assert(histRes.data.success === true, 'Historical analytics API responds successfully');
    assert(histRes.data.summary.activeDaysMonitored === 9, 'Active monitored days = 9');
    assert(histRes.data.anomalyBaseline.sampleDaysCount === 9, 'Anomaly baseline sample count N = 9');

    // Anomaly checks
    const nov03 = histRes.data.timeSeries.find(d => d.date === '2026-11-03');
    assert(nov03.anomaly.level === 'ANOMALOUS_HIGH', 'Nov 03 correctly classified as ANOMALOUS_HIGH');

    // Regional breakdown
    assert(histRes.data.regionalBreakdown.length === 8, '8 Indian states analyzed in regional breakdown');
    const pb = histRes.data.regionalBreakdown.find(s => s.stateId === 'PB');
    assert(pb.effectiveDetections === 5407, 'Punjab effective detections = 5,407');
    assert(pb.detectionDensityPer10kKm2 > 1000, `Punjab burning density > 1,000 / 10k km² (${pb.detectionDensityPer10kKm2})`);

    // ----------------------------------------------------
    // SUITE 6: Regional Comparison Engine
    // ----------------------------------------------------
    console.log('\n--- SUITE 6: Regional State Comparison Engine ---');
    const compRes = await axios.get('http://localhost:5000/api/fires/historical/compare?stateA=PB&stateB=HR');
    assert(compRes.data.success === true, 'Regional comparison API responds successfully');
    assert(compRes.data.comparison.regionA.name === 'Punjab', 'Region A is Punjab');
    assert(compRes.data.comparison.regionB.name === 'Haryana', 'Region B is Haryana');
    assert(compRes.data.comparison.ratios.effectiveDetectionsRatio === 2.91, 'Detections ratio = 2.91x (5,407 vs 1,855)');

    // ----------------------------------------------------
    // SUITE 7: RFC 4180 CSV Data Exports
    // ----------------------------------------------------
    console.log('\n--- SUITE 7: Data Export Hub (RFC 4180 CSV) ---');
    const csvDaily = await axios.get('http://localhost:5000/api/fires/historical/export?type=daily_summary');
    assert(csvDaily.status === 200, 'Daily CSV export status 200');
    assert(csvDaily.headers['content-type'].includes('text/csv'), 'Content-Type is text/csv');
    assert(csvDaily.data.includes('# NASA FIRMS Harmonized Active Fire Data Export'), 'CSV includes NASA provenance metadata header');

    const csvObs = await axios.get('http://localhost:5000/api/fires/historical/export?type=observations&limit=10');
    assert(csvObs.status === 200, 'Observations CSV export status 200');
    assert(csvObs.data.includes('observation_id,sensor,satellite,instrument'), 'Observations CSV column header present');

    const csvReg = await axios.get('http://localhost:5000/api/fires/historical/export?type=regional_summary');
    assert(csvReg.status === 200, 'Regional CSV export status 200');
    assert(csvReg.data.includes('PB,"Punjab"'), 'Regional CSV contains Punjab verified record');

    // ----------------------------------------------------
    // SUITE 8: Non-Fabrication Outside Ingested Batch
    // ----------------------------------------------------
    console.log('\n--- SUITE 8: Strict Non-Fabrication & Out-of-Range Handling ---');
    const extendedRes = await axios.get('http://localhost:5000/api/fires/historical?startDate=2026-10-01&endDate=2026-11-30');
    const inactiveDays = extendedRes.data.timeSeries.filter(d => !d.hasData);
    assert(inactiveDays.length === 52, '52 days outside active window marked inactive');
    assert(inactiveDays.every(d => d.dataAvailability === 'NO_OBSERVATIONS'), 'All inactive days strictly return NO_OBSERVATIONS');

    const multiYear = extendedRes.data.multiYearRegime;
    const absentYears = multiYear.filter(y => y.year < 2026);
    assert(absentYears.every(y => y.status === 'NO_INGESTED_DATA' && y.modis === 0), 'Years 2020-2025 strictly marked NO_INGESTED_DATA with zero simulated points');

    console.log('\n========================================================================');
    console.log(`📊 FINAL VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal verification error:', err.message, err.response?.data);
    process.exit(1);
  }
}

runAllVerificationTests();
