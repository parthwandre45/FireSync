-- ==============================================================================
-- FireSync – Sample NASA MODIS & VIIRS Active Fire Seed Data
-- ==============================================================================

-- 1. Sample MODIS Detections (Aqua & Terra ~1km)
INSERT INTO modis_fires (latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, confidence, bright_t31, frp, daynight, country_code)
VALUES 
    (37.7749, -119.5383, 335.4, 1.2, 1.1, '2026-08-15', '1330', 'Aqua', 85, 298.2, 45.8, 'D', 'USA'),
    (37.7812, -119.5420, 342.1, 1.2, 1.1, '2026-08-15', '1330', 'Aqua', 92, 301.5, 62.3, 'D', 'USA'),
    (37.7650, -119.5290, 328.0, 1.4, 1.2, '2026-08-15', '2115', 'Terra', 78, 295.0, 38.0, 'N', 'USA')
ON CONFLICT (satellite, latitude, longitude, acq_date, acq_time) DO NOTHING;

-- 2. Sample VIIRS Detections (375m I-bands)
INSERT INTO viirs_fires (latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, confidence, bright_ti5, frp, daynight, country_code)
VALUES 
    (37.7748, -119.5381, 355.2, 0.38, 0.37, '2026-08-15', '1410', 'Suomi-NPP', 'high', 305.4, 49.2, 'D', 'USA'),
    (37.7770, -119.5395, 348.6, 0.39, 0.38, '2026-08-15', '1410', 'Suomi-NPP', 'nominal', 302.1, 41.0, 'D', 'USA'),
    (37.7805, -119.5415, 362.8, 0.38, 0.37, '2026-08-15', '1410', 'Suomi-NPP', 'high', 308.0, 68.4, 'D', 'USA')
ON CONFLICT (satellite, latitude, longitude, acq_date, acq_time) DO NOTHING;

-- 3. Sample Normalized Cross-Sensor Detections
INSERT INTO normalized_fires (
    source_table, source_record_id, sensor, satellite, instrument, latitude, longitude,
    brightness_kelvin, frp_mw, confidence_raw, confidence_normalized, confidence_percent,
    estimated_internal_score, acq_timestamp, acq_date, acq_time, daynight, pixel_footprint_km2, country_code
)
VALUES
    ('modis_fires', gen_random_uuid(), 'MODIS', 'Aqua', 'MODIS', 37.7749, -119.5383, 335.4, 45.8, '85', 'HIGH', 85, 85, '2026-08-15T13:30:00Z', '2026-08-15', '1330', 'D', 1.0, 'USA'),
    ('modis_fires', gen_random_uuid(), 'MODIS', 'Aqua', 'MODIS', 37.7812, -119.5420, 342.1, 62.3, '92', 'HIGH', 92, 92, '2026-08-15T13:30:00Z', '2026-08-15', '1330', 'D', 1.0, 'USA'),
    ('viirs_fires', gen_random_uuid(), 'VIIRS', 'Suomi-NPP', 'VIIRS', 37.7748, -119.5381, 355.2, 49.2, 'high', 'HIGH', NULL, 95, '2026-08-15T14:10:00Z', '2026-08-15', '1410', 'D', 0.14, 'USA'),
    ('viirs_fires', gen_random_uuid(), 'VIIRS', 'Suomi-NPP', 'VIIRS', 37.7770, -119.5395, 348.6, 41.0, 'nominal', 'NOMINAL', NULL, 65, '2026-08-15T14:10:00Z', '2026-08-15', '1410', 'D', 0.14, 'USA')
ON CONFLICT (sensor, satellite, latitude, longitude, acq_date, acq_time) DO NOTHING;

-- 4. Sample Harmonized Cluster
INSERT INTO harmonized_fire_calendar (
    cluster_id, region_name, country_code, event_start_date, event_end_date, peak_burning_date, 
    total_frp_mw, estimated_burned_area_ha, modis_detection_count, viirs_detection_count, 
    sensor_consistency_index, centroid_lat, centroid_lon
)
VALUES (
    'YOSEMITE_2026_08', 'Sierra Nevada - Yosemite Corridor', 'USA',
    '2026-08-14', '2026-08-18', '2026-08-15',
    304.7, 4820.5, 3, 3, 0.942,
    37.7749, -119.5383
)
ON CONFLICT (cluster_id) DO NOTHING;
