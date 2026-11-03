"""
End-to-End Pipeline & FastAPI Integration Tests
NASA Space Apps Challenge 2026 - FireSync
"""

import pytest
from unittest.mock import patch
from app.services.harmonizer_engine import MasterHarmonizationEngine
from app.api.health import get_health_status
from app.api.harmonize import (
    get_harmonizer_status,
    execute_full_pipeline,
    standardize_observations,
    assign_spatial_grid,
    match_temporally,
    calibrate_sensors,
    generate_daily_activity,
    run_legacy_harmonization,
)
from app.models.schemas import (
    PipelineHarmonizeRequest,
    HarmonizeRequest,
    Stage1Request,
    Stage2Request,
    Stage3Request,
    Stage4Request,
    Stage5Request,
)


def run_sync(coroutine):
    """Executes an async endpoint coroutine synchronously without requiring event loop loopback sockets."""
    try:
        coroutine.send(None)
    except StopIteration as e:
        return e.value
    raise RuntimeError("Coroutine did not complete synchronously")


@pytest.fixture
def synthetic_observations():
    """Generates synthetic multi-sensor observation data."""
    records = []
    # Cluster 1: Coincident MODIS + VIIRS
    records.append({
        "id": "M_TEST_01",
        "latitude": 30.2500,
        "longitude": 75.1200,
        "acq_date": "2026-10-28",
        "acq_time": "0830",
        "sensor": "MODIS",
        "satellite": "Terra",
        "confidence": "85",
        "frp": 62.5,
    })
    records.append({
        "id": "V_TEST_01",
        "latitude": 30.2510,
        "longitude": 75.1215,
        "acq_date": "2026-10-28",
        "acq_time": "0842",
        "sensor": "VIIRS",
        "satellite": "Suomi-NPP",
        "confidence": "h",
        "frp": 54.0,
    })

    # Cluster 2: VIIRS-only detections (finer 375m detection of small burns)
    records.append({
        "id": "V_TEST_02",
        "latitude": 30.4000,
        "longitude": 75.3000,
        "acq_date": "2026-10-28",
        "acq_time": "0845",
        "sensor": "VIIRS",
        "satellite": "Suomi-NPP",
        "confidence": "nominal",
        "frp": 14.2,
    })

    # Cluster 3: MODIS-only detection
    records.append({
        "id": "M_TEST_02",
        "latitude": 30.7000,
        "longitude": 75.6000,
        "acq_date": "2026-10-29",
        "acq_time": "0915",
        "sensor": "MODIS",
        "satellite": "Aqua",
        "confidence": "70",
        "frp": 38.0,
    })
    return records


class TestMasterEngineE2E:
    def test_run_pipeline_success(self, synthetic_observations):
        engine = MasterHarmonizationEngine()
        result = engine.run_pipeline(
            raw_observations=synthetic_observations,
            grid_resolution_m=1000.0,
            spatial_crs="EPSG:8857",
            time_window_minutes=60.0,
            spatial_match_distance_m=1500.0,
            region_name="Test Punjab Sector",
            persist_to_db=False,
        )

        assert result["success"] is True
        assert result["pipeline_version"] == "2.0-NASA-SpaceApps"
        stages = result["pipeline_stages"]

        # Stage 1 assertions
        assert stages["stage1_standardization"]["valid_count"] == 4
        assert stages["stage1_standardization"]["sensor_counts"]["MODIS"] == 2
        assert stages["stage1_standardization"]["sensor_counts"]["VIIRS"] == 2

        # Stage 2 assertions
        assert stages["stage2_spatial_grid"]["spatial_crs"] == "EPSG:8857"
        assert stages["stage2_spatial_grid"]["unique_cells_occupied"] >= 2

        # Stage 3 assertions
        assert stages["stage3_temporal_matching"]["matched_pairs_count"] == 1
        assert stages["stage3_temporal_matching"]["modis_only_count"] == 1
        assert stages["stage3_temporal_matching"]["viirs_only_count"] == 1

        # Stage 4 assertions
        assert stages["stage4_calibration"]["calibration_status"] in ["EMPIRICALLY_VALIDATED", "EXPERIMENTAL_UNCALIBRATED"]

        # Stage 5 assertions
        reg_totals = stages["stage5_daily_activity"]["regional_totals"]
        assert reg_totals["total_modis_detections"] == 2
        assert reg_totals["total_viirs_detections"] == 2
        assert reg_totals["effective_independent_detections_sum"] == 3  # 1 matched + 1 modis_only + 1 viirs_only
        assert reg_totals["harmonized_activity_frp_mw"] > 0
        assert "nominal_ha" in reg_totals["estimated_burned_area_ha"]


class TestFastApiEndpoints:
    @patch("app.api.health.check_db_health")
    def test_health_endpoint(self, mock_db_health):
        mock_db_health.return_value = {
            "status": "connected",
            "database": "firesync_db",
            "host": "localhost",
            "port": 5432,
            "postgres_version": "PostgreSQL 16.6",
            "postgis_version": "PostGIS 3.4",
        }
        res = run_sync(get_health_status())
        assert res.status == "healthy"
        assert res.libraries.numpy is not None
        assert res.database["status"] == "connected"

    def test_harmonize_status_endpoint(self):
        res = run_sync(get_harmonizer_status())
        assert res["status"] == "ready"
        assert res["coordinate_reference_systems"]["primary_equal_area_crs"] == "EPSG:8857"
        assert "sensor_characteristics" in res
        assert "MODIS" in res["sensor_characteristics"]
        assert "VIIRS" in res["sensor_characteristics"]

    def test_pipeline_endpoint(self, synthetic_observations):
        req = PipelineHarmonizeRequest(
            observations=synthetic_observations,
            region_name="FastAPI Pipeline Sector",
            grid_resolution_m=1000.0,
            spatial_crs="EPSG:8857",
            time_window_minutes=60.0,
            spatial_match_distance_m=1500.0,
            persist_to_db=False,
        )
        res = run_sync(execute_full_pipeline(req))
        assert res["success"] is True
        assert res["pipeline_stages"]["stage3_temporal_matching"]["matched_pairs_count"] == 1
        assert res["regional_summary"]["effective_independent_detections_sum"] == 3

    def test_stage1_endpoint(self, synthetic_observations):
        req = Stage1Request(observations=synthetic_observations)
        res = run_sync(standardize_observations(req))
        assert res["success"] is True
        assert res["diagnostics"]["valid_records_count"] == 4

    def test_stage2_endpoint(self, synthetic_observations):
        from app.services.standardizer import standardizer
        std_data = standardizer.standardize_records(synthetic_observations)["data"]
        req = Stage2Request(standardized_records=std_data, grid_resolution_m=1000.0, spatial_crs="EPSG:8857")
        res = run_sync(assign_spatial_grid(req))
        assert res["success"] is True
        assert res["total_observations_assigned"] == 4

    def test_stage3_endpoint(self, synthetic_observations):
        from app.services.standardizer import standardizer
        from app.services.spatial_grid import default_spatial_grid
        std_data = standardizer.standardize_records(synthetic_observations)["data"]
        grid_data = default_spatial_grid.assign_observations_to_grid(std_data)["data"]
        req = Stage3Request(grid_assigned_records=grid_data, time_window_minutes=60.0, spatial_distance_threshold_m=1500.0)
        res = run_sync(match_temporally(req))
        assert res["success"] is True
        assert res["summary"]["matched_pairs_count"] == 1

    def test_stage4_endpoint(self):
        matched = [
            {"modis_frp_mw": 20.0 + i * 5, "viirs_frp_mw": 18.0 + i * 4, "acq_date": f"2026-10-2{8 + (i % 3)}"}
            for i in range(12)
        ]
        req = Stage4Request(matched_groups=matched, test_split_ratio=0.3)
        res = run_sync(calibrate_sensors(req))
        assert res["calibration_status"] in ["EMPIRICALLY_VALIDATED", "EXPERIMENTAL_UNCALIBRATED"]
        assert "robust_theil_sen_model" in res

    def test_stage5_endpoint(self, synthetic_observations):
        from app.services.standardizer import standardizer
        from app.services.spatial_grid import default_spatial_grid
        from app.services.temporal_matcher import default_temporal_matcher
        std_data = standardizer.standardize_records(synthetic_observations)["data"]
        grid_data = default_spatial_grid.assign_observations_to_grid(std_data)["data"]
        match_data = default_temporal_matcher.match_observations(grid_data)

        req = Stage5Request(
            grid_assigned_records=grid_data,
            temporal_matching_result=match_data,
            region_name="Stage 5 Sector",
        )
        res = run_sync(generate_daily_activity(req))
        assert res["success"] is True
        assert res["regional_totals"]["effective_independent_detections_sum"] == 3

    def test_legacy_process_endpoint(self):
        req = HarmonizeRequest(
            region_name="Legacy Cluster Test",
            start_date="2026-10-28",
            end_date="2026-10-31",
        )
        res = run_sync(run_legacy_harmonization(req))
        assert res.success is True
        assert res.region == "Legacy Cluster Test"
