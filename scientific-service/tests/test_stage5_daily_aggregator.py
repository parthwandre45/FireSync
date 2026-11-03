"""
Tests for Stage 5: Daily Harmonized Activity Aggregation Service
"""

import pytest
from app.services.daily_aggregator import DailyHarmonizedAggregator, default_daily_aggregator


class TestDailyHarmonizedAggregator:
    def test_burned_area_calculation_fre(self):
        agg = default_daily_aggregator
        # 100 MW fire for 6 hours
        res = agg.calculate_burned_area_ha(100.0, duration_hours=6.0)

        # FRE = 100 * 6 * 3600 = 2,160,000 MJ
        # Biomass = 2,160,000 * 0.368 = 794,880 kg = 794.88 tons
        # Nominal Area (25 t/ha) = 794.88 / 25 ~= 31.8 ha
        # Lower bound (45 t/ha) = 794.88 / 45 ~= 17.7 ha
        # Upper bound (15 t/ha) = 794.88 / 15 ~= 53.0 ha

        assert pytest.approx(res["nominal_ha"], abs=1.0) == 31.8
        assert pytest.approx(res["lower_bound_ha"], abs=1.0) == 17.7
        assert pytest.approx(res["upper_bound_ha"], abs=1.0) == 53.0
        assert res["lower_bound_ha"] < res["nominal_ha"] < res["upper_bound_ha"]

    def test_burned_area_zero_frp(self):
        agg = default_daily_aggregator
        res = agg.calculate_burned_area_ha(0.0)
        assert res["nominal_ha"] == 0.0
        assert res["lower_bound_ha"] == 0.0
        assert res["upper_bound_ha"] == 0.0

    def test_non_additive_effective_detection_counting(self):
        """
        CRITICAL SCIENTIFIC INTEGRITY RULE:
        Never simply add MODIS and VIIRS detection counts.
        Effective independent burning detections must equal matched pairs + MODIS-only + VIIRS-only.
        """
        agg = default_daily_aggregator

        records = [
            {"acq_date": "2026-10-28", "sensor": "MODIS", "frp_mw": 50.0, "cell_id": "G1KM_001_001", "confidence_category": "HIGH"},
            {"acq_date": "2026-10-28", "sensor": "VIIRS", "frp_mw": 45.0, "cell_id": "G1KM_001_001", "confidence_category": "HIGH"},
            {"acq_date": "2026-10-28", "sensor": "VIIRS", "frp_mw": 12.0, "cell_id": "G1KM_001_002", "confidence_category": "NOMINAL"},
        ]

        matching_result = {
            "matched_groups": [
                {
                    "acq_date": "2026-10-28",
                    "modis_frp_mw": 50.0,
                    "viirs_frp_mw": 45.0,
                    "grid_cell_id": "G1KM_001_001",
                }
            ],
            "modis_only": [],
            "viirs_only": [
                {
                    "acq_date": "2026-10-28",
                    "sensor": "VIIRS",
                    "frp_mw": 12.0,
                    "cell_id": "G1KM_001_002",
                }
            ],
        }

        result = agg.aggregate_daily_activity(
            grid_assigned_records=records,
            temporal_matching_result=matching_result,
            calibration_result={"calibration_status": "EXPERIMENTAL_UNCALIBRATED", "is_validated": False},
            region_name="Punjab Plains",
        )

        assert result["success"] is True
        day_summary = result["daily_calendar"][0]
        counts = day_summary["observation_counts"]

        # Raw counts: 1 MODIS + 2 VIIRS = 3 raw detections
        assert counts["modis_detection_count"] == 1
        assert counts["viirs_detection_count"] == 2
        assert counts["uncalibrated_raw_sum_count_DO_NOT_USE_AS_FIRE_TOTAL"] == 3

        # Effective count: 1 matched group + 0 MODIS-only + 1 VIIRS-only = 2 effective fire detections!
        assert counts["matched_observation_groups_count"] == 1
        assert counts["modis_only_count"] == 0
        assert counts["viirs_only_count"] == 1
        assert counts["effective_independent_detections"] == 2  # NOT 3!

        assert day_summary["data_availability"] == "DUAL_SENSOR_OVERPASS"
        assert day_summary["confidence_breakdown"]["HIGH"] == 2
        assert day_summary["confidence_breakdown"]["NOMINAL"] == 1

    def test_matched_frp_geometric_mean_prevents_double_counting(self):
        """
        CRITICAL SCIENTIFIC INTEGRITY RULE:
        Matched MODIS and VIIRS observations must NOT be double-counted in FRP aggregation.
        Joint FRP must use geometric mean sqrt(MODIS_FRP * VIIRS_FRP) rather than summing both.
        """
        agg = default_daily_aggregator
        records = [
            {"acq_date": "2026-10-28", "sensor": "MODIS", "frp_mw": 100.0, "cell_id": "G1KM_001_001", "confidence_category": "HIGH"},
            {"acq_date": "2026-10-28", "sensor": "VIIRS", "frp_mw": 100.0, "cell_id": "G1KM_001_001", "confidence_category": "HIGH"},
        ]
        matching_result = {
            "matched_groups": [
                {
                    "acq_date": "2026-10-28",
                    "modis_frp_mw": 100.0,
                    "viirs_frp_mw": 100.0,
                    "grid_cell_id": "G1KM_001_001",
                }
            ],
            "modis_only": [],
            "viirs_only": [],
        }
        result = agg.aggregate_daily_activity(
            grid_assigned_records=records,
            temporal_matching_result=matching_result,
            calibration_result={"calibration_status": "EXPERIMENTAL_UNCALIBRATED", "is_validated": False},
            region_name="Test Corridor",
        )
        day_summary = result["daily_calendar"][0]
        # Joint FRP should be 100.0 MW, NOT 200.0 MW!
        assert day_summary["frp_summaries"]["harmonized_activity_frp_mw"] == 100.0
        assert day_summary["observation_counts"]["effective_independent_detections"] == 1

    def test_safe_frp_handles_none_and_nan(self):
        """
        Ensure null, None, and non-numeric FRP values do not produce NaN or break aggregation.
        """
        agg = default_daily_aggregator
        records = [
            {"acq_date": "2026-10-28", "sensor": "MODIS", "frp_mw": None, "cell_id": "G1KM_001_001", "confidence_category": "HIGH"},
            {"acq_date": "2026-10-28", "sensor": "VIIRS", "frp_mw": float('nan'), "cell_id": "G1KM_001_002", "confidence_category": "NOMINAL"},
        ]
        matching_result = {
            "matched_groups": [],
            "modis_only": [{"acq_date": "2026-10-28", "sensor": "MODIS", "frp_mw": None, "cell_id": "G1KM_001_001"}],
            "viirs_only": [{"acq_date": "2026-10-28", "sensor": "VIIRS", "frp_mw": float('nan'), "cell_id": "G1KM_001_002"}],
        }
        result = agg.aggregate_daily_activity(
            grid_assigned_records=records,
            temporal_matching_result=matching_result,
            calibration_result={"calibration_status": "EXPERIMENTAL_UNCALIBRATED", "is_validated": False},
            region_name="Test Corridor",
        )
        day_summary = result["daily_calendar"][0]
        assert day_summary["frp_summaries"]["harmonized_activity_frp_mw"] == 0.0
        assert not day_summary["frp_summaries"]["harmonized_activity_frp_mw"] != day_summary["frp_summaries"]["harmonized_activity_frp_mw"]  # Not NaN

