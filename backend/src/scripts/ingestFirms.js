#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const firmsService = require('../services/firmsIngestionService');

async function main() {
  const args = process.argv.slice(2);
  const days = parseInt(args[0] || '7', 10);
  const sensor = (args[1] || 'ALL').toUpperCase();

  console.log('====================================================');
  console.log('NASA FIRMS Live Satellite Active-Fire Ingestion CLI');
  console.log('Target Region: India (IND)');
  console.log(`Observation Window: ${days} days`);
  console.log(`Sensors: ${sensor}`);
  console.log('====================================================\n');

  try {
    const result = await firmsService.runIngestionPipeline({
      targetRegion: 'IND',
      days,
      sensor,
    });

    console.log('\n--- Pipeline Result Summary ---');
    console.log(`Run ID:              ${result.runId}`);
    console.log(`Sensor:              ${result.sensor}`);
    console.log(`Total Records Fetched: ${result.totalFetched}`);
    console.log(`New Records Inserted:  ${result.totalInserted}`);
    console.log(`Duplicates Skipped:    ${result.totalDuplicates}`);
    console.log(`Execution Time:        ${result.executionTimeMs}ms`);

    if (result.sensorBreakdown) {
      console.log('\n--- Sensor Breakdown ---');
      console.log(`MODIS: Fetched: ${result.sensorBreakdown.modis.fetched}, Inserted: ${result.sensorBreakdown.modis.inserted}, Duplicates: ${result.sensorBreakdown.modis.duplicates}`);
      console.log(`VIIRS: Fetched: ${result.sensorBreakdown.viirs.fetched}, Inserted: ${result.sensorBreakdown.viirs.inserted}, Duplicates: ${result.sensorBreakdown.viirs.duplicates}`);
    }

    const stats = await firmsService.getLiveFireStats({ country: 'IND' });
    console.log('\n--- Updated Live Fire Statistics in PostgreSQL ---');
    console.log(`Total Normalized Active Fires: ${stats.summary.total_records}`);
    console.log(`MODIS Detections:             ${stats.summary.modis_count}`);
    console.log(`VIIRS Detections:             ${stats.summary.viirs_count}`);
    console.log(`Total Radiant Power (FRP):     ${stats.summary.total_frp} MW`);
    console.log(`Date Span Covered:             ${stats.summary.earliest_date} to ${stats.summary.latest_date}`);

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Ingestion CLI Failed:', err.message);
    process.exit(1);
  }
}

main();
