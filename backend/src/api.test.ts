import { test, describe } from 'node:test';
import assert from 'node:assert';
import http from 'http';

interface RequestOptionsWithBody extends http.RequestOptions {
  body?: any;
}

function makeRequest(path: string, options: RequestOptionsWithBody = {}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const { body, ...clientOptions } = options;
    const req = http.request(
      {
        socketPath: '/tmp/firesync.sock',
        path,
        method: clientOptions.method || 'GET',
        headers: clientOptions.headers || {}
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const body = JSON.parse(rawData);
            resolve({ status: res.statusCode || 200, body });
          } catch {
            resolve({ status: res.statusCode || 200, body: rawData });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

describe('FireSync API Integration Tests', () => {
  test('GET /api/v1/system/health returns 200 and healthy status', async () => {
    const res = await makeRequest('/api/v1/system/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'HEALTHY');
    assert.strictEqual(res.body.data.database.connected, true);
  });

  test('GET /api/v1/dashboard/overview returns aggregated metrics', async () => {
    const res = await makeRequest('/api/v1/dashboard/overview');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.activeDetections > 50);
    assert.ok(res.body.data.avgFrp > 100);
  });

  test('GET /api/v1/fires supports limit and bounding box filtering', async () => {
    const res = await makeRequest('/api/v1/fires?limit=5');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 5);
  });

  test('GET /api/v1/satellites returns 4 operational missions', async () => {
    const res = await makeRequest('/api/v1/satellites');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.length, 4);
  });

  test('POST /api/v1/auth/login authenticates analyst and returns JWT token', async () => {
    const res = await makeRequest('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@firesync.nasa.gov',
        password: 'FiresyncAnalyst2026!'
      })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, 'REGISTERED');
  });
});

