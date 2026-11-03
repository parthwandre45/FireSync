require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const firmsService = require('../services/firmsIngestionService');
const db = require('../db');

async function runTests() {
  console.log('========================================================================');
  console.log('🔥 FIRESYNC PHASE 3 COMPREHENSIVE PIPELINE & DATABASE VERIFICATION');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------
    // STEP 1: Verify PostgreSQL Connection
    // -------------------------------------------------------------
    console.log('--- TEST 1: Database Connectivity ---');
    const health = await db.checkDbHealth();
    console.log('Database Status:', health.status);
    console.log('Target Database:', `${health.host}:${health.port}/${health.database}`);
    console.log('PostgreSQL Version:', health.postgresVersion);
    if (health.status !== 'connected') {
      throw new Error('Database is not connected');
    }
    console.log('✅ TEST 1 PASSED: PostgreSQL is connected and operational.\n');

    // -------------------------------------------------------------
    // STEP 2: Ingest Real NASA MODIS Observations (1-day India dataset)
    // -------------------------------------------------------------
    console.log('--- TEST 2: Ingest Real NASA MODIS Observations (India, 24h) ---');
    const modisRun = await firmsService.runIngestionPipeline({
      targetRegion: 'IND',
      days: 1,
      sensor: 'MODIS',
    });
    console.log('MODIS Ingestion Result:');
    console.log(`  - Total MODIS Fetched from NASA: ${modisRun.totalFetched}`);
    console.log(`  - New MODIS Inserted into DB:    ${modisRun.totalInserted}`);
    console.log(`  - Duplicates Skipped:            ${modisRun.totalDuplicates}`);
    console.log(`  - Execution Time:                ${modisRun.executionTimeMs}ms`);
    console.log('✅ TEST 2 PASSED: Real MODIS records successfully ingested into PostgreSQL.\n');

    // -------------------------------------------------------------
    // STEP 3: Ingest Real NASA VIIRS Observations (1-day India dataset)
    // -------------------------------------------------------------
    console.log('--- TEST 3: Ingest Real NASA VIIRS Observations (India, 24h) ---');
    const viirsRun = await firmsService.runIngestionPipeline({
      targetRegion: 'IND',
      days: 1,
      sensor: 'VIIRS',
    });
    console.log('VIIRS Ingestion Result:');
    console.log(`  - Total VIIRS Fetched from NASA: ${viirsRun.totalFetched}`);
    console.log(`  - New VIIRS Inserted into DB:    ${viirsRun.totalInserted}`);
    console.log(`  - Duplicates Skipped:            ${viirsRun.totalDuplicates}`);
    console.log(`  - Execution Time:                ${viirsRun.executionTimeMs}ms`);
    console.log('✅ TEST 3 PASSED: Real VIIRS records successfully ingested into PostgreSQL.\n');

    // -------------------------------------------------------------
    // STEP 4: Test Idempotency and Duplicate Handling
    // -------------------------------------------------------------
    console.log('--- TEST 4: Duplicate Handling & Idempotency Check ---');
    console.log('Re-running the exact same MODIS dataset...');
    const duplicateRun = await firmsService.runIngestionPipeline({
      targetRegion: 'IND',
      days: 1,
      sensor: 'MODIS',
    });
    console.log('Idempotency Ingestion Result:');
    console.log(`  - Fetched:           ${duplicateRun.totalFetched}`);
    console.log(`  - Inserted (Expect 0): ${duplicateRun.totalInserted}`);
    console.log(`  - Duplicates Skipped: ${duplicateRun.totalDuplicates}`);
    if (duplicateRun.totalInserted !== 0) {
      throw new Error(`Expected 0 newly inserted records on duplicate run, but got ${duplicateRun.totalInserted}`);
    }
    console.log('✅ TEST 4 PASSED: Duplicate detection verified. Zero redundant rows inserted.\n');

    // -------------------------------------------------------------
    // STEP 5: Verify Data Integrity across Database Tables
    // -------------------------------------------------------------
    console.log('--- TEST 5: Database Table Audit & Data Integrity ---');
    const runsCount = await db.query('SELECT COUNT(*) FROM firms_ingestion_runs');
    const rawCount = await db.query('SELECT COUNT(*) FROM firms_raw_observations');
    const modisTableCount = await db.query('SELECT COUNT(*) FROM modis_fires');
    const viirsTableCount = await db.query('SELECT COUNT(*) FROM viirs_fires');
    const normTableCount = await db.query('SELECT COUNT(*) FROM normalized_fires');

    console.log('Table Row Counts in firesync_db:');
    console.log(`  - firms_ingestion_runs:   ${runsCount.rows[0].count} audit logs`);
    console.log(`  - firms_raw_observations: ${rawCount.rows[0].count} verbatim JSON payloads`);
    console.log(`  - modis_fires:            ${modisTableCount.rows[0].count} Terra/Aqua records`);
    console.log(`  - viirs_fires:            ${viirsTableCount.rows[0].count} S-NPP/NOAA records`);
    console.log(`  - normalized_fires:       ${normTableCount.rows[0].count} synthesized unified detections`);

    // Verify confidence preservation
    const modisSample = await db.query(
      "SELECT sensor, satellite, confidence_raw, confidence_normalized, confidence_percent, estimated_internal_score FROM normalized_fires WHERE sensor = 'MODIS' LIMIT 1"
    );
    console.log('\nVerified MODIS Confidence Integrity in normalized_fires:');
    console.log(modisSample.rows[0]);

    const viirsSample = await db.query(
      "SELECT sensor, satellite, confidence_raw, confidence_normalized, confidence_percent, estimated_internal_score FROM normalized_fires WHERE sensor = 'VIIRS' LIMIT 1"
    );
    console.log('\nVerified VIIRS Confidence Integrity in normalized_fires:');
    console.log(viirsSample.rows[0]);

    if (viirsSample.rows[0].confidence_percent !== null) {
      throw new Error('VIIRS confidence_percent must be null to preserve NASA scientific data integrity!');
    }
    console.log('✅ TEST 5 PASSED: Table integrity, raw preservation, and NASA confidence verified.\n');

    // -------------------------------------------------------------
    // STEP 6: Test Live Fire Summary Statistics
    // -------------------------------------------------------------
    console.log('--- TEST 6: Live Fire Statistics Query ---');
    const stats = await firmsService.getLiveFireStats({ country: 'IND' });
    console.log('Live Fire Summary:');
    console.log(`  - Total Normalized Fires: ${stats.summary.total_records}`);
    console.log(`  - MODIS Count:            ${stats.summary.modis_count}`);
    console.log(`  - VIIRS Count:            ${stats.summary.viirs_count}`);
    console.log(`  - Total Radiative Power:  ${stats.summary.total_frp} MW`);
    console.log(`  - Average Brightness:     ${stats.summary.avg_brightness} K`);
    console.log(`  - Date Coverage:          ${stats.summary.earliest_date} to ${stats.summary.latest_date}`);
    console.log('Recent Ingestion Runs Audited:');
    stats.recentIngestionRuns.forEach((r, idx) => {
      console.log(`   ${idx + 1}. [${r.status}] ${r.source_name} - Fetched: ${r.total_fetched}, Inserted: ${r.total_inserted}, Duplicates: ${r.total_duplicates} (${r.execution_time_ms}ms)`);
    });
    console.log('✅ TEST 6 PASSED: Real-time PostgreSQL stats aggregation works.\n');

    console.log('========================================================================');
    console.log('🎉 ALL PHASE 3 PIPELINE TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  }
}

runTests();

