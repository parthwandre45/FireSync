"""
Master Harmonization Engine Orchestrator
NASA Space Apps Challenge 2026 - FireSync
Integrates Stages 1 to 5 into an end-to-end scientific pipeline.
"""

import logging
from typing import Dict, Any, List, Optional
import numpy as np
import psycopg2
from app.core.config import settings
from app.services.standardizer import standardizer
from app.services.spatial_grid import SpatialGridManager
from app.services.temporal_matcher import SpatioTemporalMatcher
from app.services.calibrator import SensorCalibrator
from app.services.daily_aggregator import DailyHarmonizedAggregator

logger = logging.getLogger("firesync.harmonizer_engine")

class MasterHarmonizationEngine:
    """
    Unified scientific processing engine coordinating Stages 1-5 of the FireSync pipeline.
    """

    def __init__(self):
        self.standardizer = standardizer
        self.calibrator = SensorCalibrator()
        self.daily_aggregator = DailyHarmonizedAggregator()

    def run_pipeline(
        self,
        raw_observations: List[Dict[str, Any]],
        grid_resolution_m: float = 1000.0,
        spatial_crs: str = "EPSG:8857",
        time_window_minutes: float = 60.0,
        spatial_match_distance_m: float = 1500.0,
        region_name: str = "India Regional Corridor",
        persist_to_db: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end multi-stage harmonization pipeline.
        """
        logger.info(f"Starting FireSync Harmonization Engine for {region_name} ({len(raw_observations)} raw observations)")

        # -------------------------------------------------------------
        # STAGE 1: Data Standardization & Validation
        # -------------------------------------------------------------
        std_result = self.standardizer.standardize_records(raw_observations)
        standardized_records = std_result["data"]
        std_diagnostics = std_result["diagnostics"]

        if not standardized_records:
            return {
                "success": False,
                "error": "No valid observations remained after Stage 1 standardization.",
                "stage1_diagnostics": std_diagnostics,
            }

        # -------------------------------------------------------------
        # STAGE 2: Spatial Harmonization (Equal-Area Common Grid)
        # -------------------------------------------------------------
        grid_mgr = SpatialGridManager(target_crs=spatial_crs, grid_resolution_m=grid_resolution_m)
        grid_result = grid_mgr.assign_observations_to_grid(standardized_records)
        grid_assigned_records = grid_result["data"]

        # -------------------------------------------------------------
        # STAGE 3: Temporal Matching (Multi-Sensor Coincidence)
        # -------------------------------------------------------------
        matcher = SpatioTemporalMatcher(
            time_window_minutes=time_window_minutes,
            spatial_distance_threshold_m=spatial_match_distance_m,
        )
        match_result = matcher.match_observations(grid_assigned_records)

        # -------------------------------------------------------------
        # STAGE 4: Sensor-Aware Calibration & Held-Out Validation
        # -------------------------------------------------------------
        matched_groups = match_result["matched_groups"]
        calibration_result = self.calibrator.train_and_validate_calibration(matched_groups)

        # -------------------------------------------------------------
        # STAGE 5: Daily Harmonized Activity Aggregation
        # -------------------------------------------------------------
        daily_result = self.daily_aggregator.aggregate_daily_activity(
            grid_assigned_records=grid_assigned_records,
            temporal_matching_result=match_result,
            calibration_result=calibration_result,
            region_name=region_name,
        )

        # Optional: Persist to PostgreSQL harmonized_fire_calendar table
        persisted_records_count = 0
        if persist_to_db:
            try:
                persisted_records_count = self.persist_daily_calendar_to_db(
                    daily_calendar=daily_result["daily_calendar"],
                    region_name=region_name,
                    spatial_grid_mgr=grid_mgr,
                    grid_assigned_records=grid_assigned_records,
                )
            except Exception as e:
                logger.warning(f"Failed to persist to PostgreSQL harmonized_fire_calendar: {e}")

        return {
            "success": True,
            "pipeline_version": "2.0-NASA-SpaceApps",
            "region_name": region_name,
            "pipeline_stages": {
                "stage1_standardization": {
                    "total_input": std_diagnostics["total_input_records"],
                    "valid_count": std_diagnostics["valid_records_count"],
                    "rejected_count": std_diagnostics["rejected_records_count"],
                    "sensor_counts": std_diagnostics["sensor_counts"],
                    "temporal_range": std_diagnostics["temporal_range"],
                },
                "stage2_spatial_grid": {
                    "spatial_crs": grid_result["grid_parameters"]["spatial_crs"],
                    "resolution_m": grid_result["grid_parameters"]["grid_resolution_m"],
                    "unique_cells_occupied": grid_result["total_unique_cells_occupied"],
                    "scientific_limitations_acknowledged": True,
                },
                "stage3_temporal_matching": {
                    "time_window_minutes": time_window_minutes,
                    "spatial_threshold_m": spatial_match_distance_m,
                    "matched_pairs_count": match_result["summary"]["matched_pairs_count"],
                    "modis_only_count": match_result["summary"]["modis_only_count"],
                    "viirs_only_count": match_result["summary"]["viirs_only_count"],
                    "modis_match_rate_pct": match_result["summary"]["modis_match_rate_pct"],
                    "viirs_match_rate_pct": match_result["summary"]["viirs_match_rate_pct"],
                },
                "stage4_calibration": {
                    "calibration_status": calibration_result["calibration_status"],
                    "is_empirically_validated": calibration_result["is_validated"],
                    "validation_metrics": calibration_result.get("validation_metrics"),
                    "theil_sen_model": calibration_result.get("robust_theil_sen_model"),
                },
                "stage5_daily_activity": {
                    "regional_totals": daily_result["regional_totals"],
                    "daily_calendar_days": len(daily_result["daily_calendar"]),
                    "persisted_to_db_rows": persisted_records_count,
                },
            },
            "regional_summary": daily_result["regional_totals"],
            "daily_calendar": daily_result["daily_calendar"],
            "matched_groups_sample": matched_groups[:20],
            "metadata_and_uncertainty": daily_result["metadata_and_uncertainty"],
        }

    def fetch_observations_from_db(
        self,
        country_code: str = "IND",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Fetches normalized active-fire observations directly from PostgreSQL normalized_fires.
        """
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            connect_timeout=5,
        )
        cur = conn.cursor()

        query = """
            SELECT 
                id, sensor, satellite, instrument, latitude, longitude,
                brightness_kelvin, frp_mw, confidence_raw, confidence_normalized,
                confidence_percent, estimated_internal_score, acq_timestamp, acq_date, acq_time,
                daynight, pixel_footprint_km2, country_code, raw_metadata
            FROM normalized_fires
            WHERE country_code = %s
        """
        params = [country_code]

        if start_date:
            query += " AND acq_date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND acq_date <= %s"
            params.append(end_date)

        if limit is not None and limit > 0:
            query += " ORDER BY acq_timestamp ASC LIMIT %s"
            params.append(limit)
        else:
            query += " ORDER BY acq_timestamp ASC"

        cur.execute(query, tuple(params))
        cols = [desc[0] for desc in cur.description]
        rows = cur.fetchall()

        cur.close()
        conn.close()

        records = []
        for r in rows:
            d = dict(zip(cols, r))
            # Format datetime
            if hasattr(d.get("acq_timestamp"), "isoformat"):
                d["acq_timestamp_utc"] = d["acq_timestamp"].isoformat()
            if hasattr(d.get("acq_date"), "strftime"):
                d["acq_date"] = d["acq_date"].strftime("%Y-%m-%d")
            records.append(d)

        return records

    def persist_daily_calendar_to_db(
        self,
        daily_calendar: List[Dict[str, Any]],
        region_name: str,
        spatial_grid_mgr: SpatialGridManager,
        grid_assigned_records: List[Dict[str, Any]],
    ) -> int:
        """
        Persists synthesized daily calendar records into PostgreSQL harmonized_fire_calendar table.
        """
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            connect_timeout=5,
        )
        conn.autocommit = True
        cur = conn.cursor()

        persisted = 0
        for idx, day in enumerate(daily_calendar):
            cluster_id = f"HARM_{region_name.upper().replace(' ', '_')}_{day['date'].replace('-', '')}_{idx+1:03d}"
            event_date = day["date"]
            total_frp = float(day["frp_summaries"]["harmonized_activity_frp_mw"])
            burned_ha = float(day["estimated_burned_area"]["nominal_ha"])
            m_count = int(day["observation_counts"]["modis_detection_count"])
            v_count = int(day["observation_counts"]["viirs_detection_count"])
            consistency = round(
                min(m_count, v_count) / max(m_count, v_count) if max(m_count, v_count) > 0 else 0.0,
                3,
            )

            # Compute day's observation centroid
            day_records = [r for r in grid_assigned_records if r.get("acq_date") == event_date]
            if day_records:
                c_lat = round(float(np.mean([r["latitude"] for r in day_records])), 6)
                c_lon = round(float(np.mean([r["longitude"] for r in day_records])), 6)
            else:
                c_lat = 0.0
                c_lon = 0.0

            cur.execute("""
                INSERT INTO harmonized_fire_calendar (
                    cluster_id, region_name, country_code, event_start_date, event_end_date,
                    peak_burning_date, total_frp_mw, estimated_burned_area_ha,
                    modis_detection_count, viirs_detection_count, sensor_consistency_index,
                    centroid_lat, centroid_lon
                )
                VALUES (%s, %s, 'IND', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (cluster_id) DO UPDATE SET
                    total_frp_mw = EXCLUDED.total_frp_mw,
                    estimated_burned_area_ha = EXCLUDED.estimated_burned_area_ha,
                    modis_detection_count = EXCLUDED.modis_detection_count,
                    viirs_detection_count = EXCLUDED.viirs_detection_count,
                    sensor_consistency_index = EXCLUDED.sensor_consistency_index,
                    centroid_lat = EXCLUDED.centroid_lat,
                    centroid_lon = EXCLUDED.centroid_lon
            """, (
                cluster_id, region_name, event_date, event_date, event_date,
                total_frp, burned_ha, m_count, v_count, consistency, c_lat, c_lon
            ))
            persisted += 1

        cur.close()
        conn.close()
        return persisted

master_harmonizer = MasterHarmonizationEngine()

