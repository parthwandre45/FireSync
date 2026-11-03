require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const firmsService = require('../services/firmsIngestionService');

async function testSensors() {
  console.log('========================================================================');
  console.log('TESTING REAL NASA FIRMS RETRIEVAL FOR INDIA (IND)');
  console.log('========================================================================');

  // Test 1: MODIS
  console.log('\n--- 1. Testing MODIS Data Retrieval (24h) ---');
  try {
    const modisRes = await firmsService.fetchModisObservations({ days: 1 });
    console.log(`MODIS Source: ${modisRes.source}`);
    console.log(`MODIS Records Filtered to India: ${modisRes.records.length}`);
    if (modisRes.records.length > 0) {
      const sample = modisRes.records[0];
      console.log('Sample MODIS record:');
      console.log(`  Sensor: MODIS (${sample.satellite})`);
      console.log(`  Coordinates: (${sample.latitude}, ${sample.longitude})`);
      console.log(`  Acquisition: ${sample.acq_date} ${sample.acq_time} UTC`);
      console.log(`  Brightness: ${sample.brightness} K | FRP: ${sample.frp} MW`);
      console.log(`  Confidence: ${sample.confidence}%`);
    }
  } catch (err) {
    console.error('MODIS Retrieval Error:', err.message);
  }

  // Test 2: VIIRS
  console.log('\n--- 2. Testing VIIRS Data Retrieval (24h) ---');
  try {
    const viirsRes = await firmsService.fetchViirsObservations({ days: 1 });
    console.log(`VIIRS Source: ${viirsRes.source}`);
    console.log(`VIIRS Records Filtered to India: ${viirsRes.records.length}`);
    if (viirsRes.records.length > 0) {
      const sample = viirsRes.records[0];
      console.log('Sample VIIRS record:');
      console.log(`  Sensor: VIIRS (${sample.satellite})`);
      console.log(`  Coordinates: (${sample.latitude}, ${sample.longitude})`);
      console.log(`  Acquisition: ${sample.acq_date} ${sample.acq_time} UTC`);
      console.log(`  Brightness (I-4): ${sample.bright_ti4 || sample.brightness} K | FRP: ${sample.frp} MW`);
      console.log(`  NASA Confidence: ${sample.confidence}`);
    }
  } catch (err) {
    console.error('VIIRS Retrieval Error:', err.message);
  }
  
  process.exit(0);
}

testSensors();

