-- ==============================================================================
-- FireSync – Unified Satellite Fire Intelligence (NASA Space Apps Challenge 2026)
-- PostgreSQL + PostGIS Schema for Real NASA FIRMS Satellite Active-Fire Observations
-- ==============================================================================

-- 1. Try to enable extensions (uuid-ossp, pgcrypto, postgis)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS extension not available in this PostgreSQL instance; continuing with standard coordinates and geometries.';
END $$;

-- 2. Ingestion Execution Audit Log Table
CREATE TABLE IF NOT EXISTS firms_ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name VARCHAR(64) NOT NULL,            -- e.g. 'MODIS_NRT', 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT'
    target_region VARCHAR(64) NOT NULL,           -- e.g. 'IND', 'South_Asia', 'India_Bounding_Box'
    date_range_queried VARCHAR(64),               -- e.g. '7d', '2026-10-01 to 2026-10-31'
    status VARCHAR(20) NOT NULL,                  -- 'IN_PROGRESS', 'SUCCESS', 'FAILED'
    total_fetched INT DEFAULT 0,
    total_inserted INT DEFAULT 0,
    total_duplicates INT DEFAULT 0,
    execution_time_ms INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 3. Raw Untouched Observations Store (Preserves verbatim API payload)
CREATE TABLE IF NOT EXISTS firms_raw_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingestion_run_id UUID REFERENCES firms_ingestion_runs(id) ON DELETE SET NULL,
    sensor VARCHAR(20) NOT NULL,                  -- 'MODIS' or 'VIIRS'
    product VARCHAR(64) NOT NULL,                 -- e.g. 'MODIS_C6_1', 'SUOMI_VIIRS_C2', 'J1_VIIRS_C2'
    country_code VARCHAR(10) DEFAULT 'IND',
    raw_payload JSONB NOT NULL,                   -- Complete original verbatim record dictionary
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. NASA MODIS Active Fire Detections (Aqua & Terra)
-- Nominal Resolution: ~1,000 m (1 km at nadir)
CREATE TABLE IF NOT EXISTS modis_fires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    brightness NUMERIC(6, 2) NOT NULL,            -- Channel 21/22 Brightness Temperature (Kelvin)
    scan NUMERIC(4, 2) NOT NULL,                  -- Along-scan pixel dimension (km)
    track NUMERIC(4, 2) NOT NULL,                 -- Along-track pixel dimension (km)
    acq_date DATE NOT NULL,                       -- Acquisition date (YYYY-MM-DD)
    acq_time VARCHAR(4) NOT NULL,                 -- Acquisition time (HHMM UTC)
    satellite VARCHAR(20) NOT NULL,               -- 'Terra' (T) or 'Aqua' (A)
    instrument VARCHAR(20) DEFAULT 'MODIS',
    confidence INT CHECK (confidence BETWEEN 0 AND 100), -- Detection confidence (0-100%)
    version VARCHAR(20) DEFAULT '6.1NRT',
    bright_t31 NUMERIC(6, 2),                     -- Channel 31 Brightness Temperature (Kelvin)
    frp NUMERIC(8, 2),                            -- Fire Radiative Power (MW)
    daynight VARCHAR(2) DEFAULT 'D',              -- 'D' (Day) or 'N' (Night)
    country_code VARCHAR(10) DEFAULT 'IND',
    raw_id UUID REFERENCES firms_raw_observations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Idempotent natural key constraint for duplicate prevention
    CONSTRAINT uq_modis_fire_observation UNIQUE (satellite, latitude, longitude, acq_date, acq_time)
);

-- 5. NASA VIIRS Active Fire Detections (Suomi-NPP, NOAA-20, NOAA-21)
-- Nominal Resolution: 375 m (I-bands)
CREATE TABLE IF NOT EXISTS viirs_fires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    bright_ti4 NUMERIC(6, 2) NOT NULL,            -- I-4 Channel Brightness Temperature (Kelvin)
    scan NUMERIC(4, 2) NOT NULL,                  -- Along-scan pixel dimension
    track NUMERIC(4, 2) NOT NULL,                 -- Along-track pixel dimension
    acq_date DATE NOT NULL,                       -- Acquisition date (YYYY-MM-DD)
    acq_time VARCHAR(4) NOT NULL,                 -- Acquisition time (HHMM UTC)
    satellite VARCHAR(30) NOT NULL,               -- 'Suomi-NPP' (N), 'NOAA-20' (J1), 'NOAA-21' (J2)
    instrument VARCHAR(20) DEFAULT 'VIIRS',
    confidence VARCHAR(20) DEFAULT 'nominal',     -- 'low', 'nominal', 'high'
    version VARCHAR(20) DEFAULT '2.0NRT',
    bright_ti5 NUMERIC(6, 2),                     -- I-5 Channel Brightness Temperature (Kelvin)
    frp NUMERIC(8, 2),                            -- Fire Radiative Power (MW)
    daynight VARCHAR(2) DEFAULT 'D',              -- 'D' or 'N'
    country_code VARCHAR(10) DEFAULT 'IND',
    raw_id UUID REFERENCES firms_raw_observations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Idempotent natural key constraint for duplicate prevention
    CONSTRAINT uq_viirs_fire_observation UNIQUE (satellite, latitude, longitude, acq_date, acq_time)
);

-- 6. Unified Normalized Active Fire Observations Table
-- Common normalized schema synthesizing MODIS and VIIRS records
CREATE TABLE IF NOT EXISTS normalized_fires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table VARCHAR(20) NOT NULL,            -- 'modis_fires' or 'viirs_fires'
    source_record_id UUID NOT NULL,
    sensor VARCHAR(20) NOT NULL,                  -- 'MODIS' or 'VIIRS'
    satellite VARCHAR(30) NOT NULL,
    instrument VARCHAR(20) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    brightness_kelvin NUMERIC(6, 2) NOT NULL,
    frp_mw NUMERIC(8, 2),
    confidence_raw VARCHAR(20),
    confidence_normalized VARCHAR(20) NOT NULL,   -- 'LOW', 'NOMINAL', 'HIGH'
    confidence_percent INT,                       -- Real NASA confidence percentage (MODIS only, NULL for VIIRS)
    estimated_internal_score INT,                 -- Derived internal modeling score (not official NASA percentage)
    acq_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    acq_date DATE NOT NULL,
    acq_time VARCHAR(4) NOT NULL,
    daynight VARCHAR(2) NOT NULL,
    pixel_footprint_km2 NUMERIC(6, 4) NOT NULL,   -- e.g. 1.0 for MODIS, 0.14 for VIIRS
    country_code VARCHAR(10) DEFAULT 'IND',
    raw_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_normalized_fire_observation UNIQUE (sensor, satellite, latitude, longitude, acq_date, acq_time)
);

-- 7. Harmonized Burning Activity Calendar Store
CREATE TABLE IF NOT EXISTS harmonized_fire_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id VARCHAR(64) NOT NULL,
    region_name VARCHAR(128) NOT NULL,
    country_code VARCHAR(10) DEFAULT 'IND',
    event_start_date DATE NOT NULL,
    event_end_date DATE NOT NULL,
    peak_burning_date DATE NOT NULL,
    total_frp_mw NUMERIC(12, 2) NOT NULL,
    estimated_burned_area_ha NUMERIC(12, 2) NOT NULL,
    modis_detection_count INT DEFAULT 0,
    viirs_detection_count INT DEFAULT 0,
    sensor_consistency_index NUMERIC(4, 3) CHECK (sensor_consistency_index BETWEEN 0 AND 1),
    centroid_lat NUMERIC(9, 6),
    centroid_lon NUMERIC(9, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_harmonized_cluster UNIQUE (cluster_id)
);

-- 8. Performance Indexes for Rapid Spatial & Temporal Analysis
CREATE INDEX IF NOT EXISTS idx_modis_fires_coords ON modis_fires (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_modis_fires_acq_date ON modis_fires (acq_date);
CREATE INDEX IF NOT EXISTS idx_modis_fires_country ON modis_fires (country_code);

CREATE INDEX IF NOT EXISTS idx_viirs_fires_coords ON viirs_fires (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_viirs_fires_acq_date ON viirs_fires (acq_date);
CREATE INDEX IF NOT EXISTS idx_viirs_fires_country ON viirs_fires (country_code);

CREATE INDEX IF NOT EXISTS idx_normalized_fires_coords ON normalized_fires (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_normalized_fires_timestamp ON normalized_fires (acq_timestamp);
CREATE INDEX IF NOT EXISTS idx_normalized_fires_date ON normalized_fires (acq_date);
CREATE INDEX IF NOT EXISTS idx_normalized_fires_sensor ON normalized_fires (sensor);
CREATE INDEX IF NOT EXISTS idx_normalized_fires_country ON normalized_fires (country_code);

CREATE INDEX IF NOT EXISTS idx_harmonized_dates ON harmonized_fire_calendar (event_start_date, event_end_date);
CREATE INDEX IF NOT EXISTS idx_harmonized_region ON harmonized_fire_calendar (region_name);
