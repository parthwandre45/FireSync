import { test, describe } from 'node:test';
import assert from 'node:assert';
import { haversineDistanceKm } from './firmsIngestionService';
import { classifyLocation } from './fireService';

describe('FirmsIngestionService Unit Tests', () => {
  test('haversineDistanceKm calculates accurate distance between two points', () => {
    // Distance between London (51.5074, -0.1278) and Paris (48.8566, 2.3522) ~ 343 km
    const dist = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522);
    assert.ok(dist > 330 && dist < 360, `Expected ~343km, got ${dist}`);
  });

  test('haversineDistanceKm returns 0 for identical coordinates', () => {
    const dist = haversineDistanceKm(39.80, -120.90, 39.80, -120.90);
    assert.strictEqual(Math.round(dist), 0);
  });

  test('classifyLocation accurately resolves continent and country', () => {
    const brazil = classifyLocation(-11.85, -55.50);
    assert.strictEqual(brazil.country, 'Brazil');
    assert.strictEqual(brazil.continent, 'South America');

    const usa = classifyLocation(39.80, -120.90);
    assert.strictEqual(usa.country, 'United States');
    assert.strictEqual(usa.continent, 'North America');

    const australia = classifyLocation(-16.50, 133.20);
    assert.strictEqual(australia.country, 'Australia');
    assert.strictEqual(australia.continent, 'Oceania');
  });
});

