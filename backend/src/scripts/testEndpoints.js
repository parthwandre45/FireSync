const http = require('http');
const app = require('../app');

async function testApi() {
  console.log('========================================================================');
  console.log('TESTING BACKEND EXPRESS API GATEWAY ENDPOINTS');
  console.log('========================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Ephemeral test server listening on ${baseUrl}\n`);

  const axios = require('axios');
  const client = axios.create({ baseURL: baseUrl, timeout: 5000 });

  try {
    // 1. Root Gateway Endpoint
    console.log('1. Testing GET /');
    const rootRes = await client.get('/');
    console.log(`   Status: ${rootRes.status} | Project: ${rootRes.data.project}`);

    // 2. Database Health Endpoint
    console.log('\n2. Testing GET /api/health/db');
    const dbRes = await client.get('/api/health/db');
    console.log(`   Status: ${dbRes.status} | DB Status: ${dbRes.data.status} | Target: ${dbRes.data.database}`);

    // 3. Composite Health Endpoint
    console.log('\n3. Testing GET /api/health');
    const compRes = await client.get('/api/health');
    console.log(`   Status: ${compRes.status} | Gateway Status: ${compRes.data.status}`);
    console.log(`   PostgreSQL: ${compRes.data.dependencies.postgreSQL.status}`);

    // 4. Live Fire Status Endpoint
    console.log('\n4. Testing GET /api/fires/live/status?country=IND');
    const liveStatsRes = await client.get('/api/fires/live/status?country=IND');
    console.log(`   Status: ${liveStatsRes.status} | Success: ${liveStatsRes.data.success}`);
    console.log(`   Total Fires in DB: ${liveStatsRes.data.summary.total_records} (${liveStatsRes.data.summary.modis_count} MODIS, ${liveStatsRes.data.summary.viirs_count} VIIRS)`);
    console.log(`   Total Radiative Power: ${liveStatsRes.data.summary.total_frp} MW`);

    // 5. Live Fire Points Query
    console.log('\n5. Testing GET /api/fires/live?country=IND&limit=3');
    const livePointsRes = await client.get('/api/fires/live?country=IND&limit=3');
    console.log(`   Status: ${livePointsRes.status} | Records Returned: ${livePointsRes.data.count}`);
    if (livePointsRes.data.records.length > 0) {
      const pt = livePointsRes.data.records[0];
      console.log(`   Sample Detections: ${pt.sensor} (${pt.satellite}) at [${pt.latitude}, ${pt.longitude}], FRP: ${pt.frp_mw}MW, Conf: ${pt.confidence_raw}`);
    }

    // 6. Sample Observations Endpoint
    console.log('\n6. Testing GET /api/fires/sample');
    const sampleRes = await client.get('/api/fires/sample');
    console.log(`   Status: ${sampleRes.status} | Demo Modis Points: ${sampleRes.data.modis.length} | Demo VIIRS Points: ${sampleRes.data.viirs.length}`);

    console.log('\n========================================================================');
    console.log('✅ ALL BACKEND API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!');
    console.log('========================================================================');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('API Endpoint Test Error:', err.message);
    server.close();
    process.exit(1);
  }
}

testApi();

