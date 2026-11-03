# FireSync Database (PostgreSQL + PostGIS)

This directory contains the database initialization schema and sample seed data for the **FireSync** project.

## Schema Overview
- **`modis_fires`**: High-temporal satellite active fire detections from NASA MODIS (Aqua & Terra sensors, ~1 km nominal resolution).
- **`viirs_fires`**: High-spatial active fire detections from NASA VIIRS (Suomi-NPP, NOAA-20, NOAA-21 sensors, 375 m I-band resolution).
- **`harmonized_fire_calendar`**: Harmonized multi-sensor clusters combining MODIS and VIIRS observations into a continuous burning activity calendar.

## Running with Local PostgreSQL
1. Ensure PostgreSQL is installed with the PostGIS extension.
2. Create the database:
   ```bash
   createdb -U postgres firesync_db
   ```
3. Run the initialization script:
   ```bash
   psql -U postgres -d firesync_db -f init.sql
   ```
4. Optional: Load sample NASA seed observations:
   ```bash
   psql -U postgres -d firesync_db -f seed_sample_data.sql
   ```

## Running with Docker
A pre-configured Docker container with PostGIS is included in `docker-compose.yml`:
```bash
docker compose up -d postgres
```
The `init.sql` script will automatically execute on container creation.
