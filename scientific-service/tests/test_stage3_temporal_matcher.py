"""
Tests for Stage 3: Spatio-Temporal Observation Matching Service
"""

import pytest
from app.services.standardizer import standardizer
from app.services.spatial_grid import default_spatial_grid
from app.services.temporal_matcher import SpatioTemporalMatcher, default_temporal_matcher


@pytest.fixture
def sample_grid_records():
    """
    Creates a set of observations:
    - MODIS_1 and VIIRS_1: Coincident (same location ~100m, 15 min apart) -> Should MATCH
    - VIIRS_2: Near MODIS_1 (~200m, 20 min apart) -> Should NOT match MODIS_1 because MODIS_1 already paired! (Double-matching prevention)
    - MODIS_2: Distant (10 km away) -> Should be MODIS_ONLY
    - VIIRS_3: At MODIS_2's location but 4 hours later -> Should be VIIRS_ONLY (Exceeds 60 min window)
    """
    raw = [
        # MODIS_1: Center
        {
            "id": "M1",
            "latitude": 30.5000,
            "longitude": 75.8000,
            "acq_date": "2026-10-28",
            "acq_time": "0830",
            "sensor": "MODIS",
            "frp": 50.0,
        },
        # VIIRS_1: Very close to M1 (~100m), 15 min apart
        {
            "id": "V1",
            "latitude": 30.5008,
            "longitude": 75.8005,
            "acq_date": "2026-10-28",
            "acq_time": "0845",
            "sensor": "VIIRS",
            "frp": 45.0,
        },
        # VIIRS_2: Also close to M1 (~200m), 20 min apart (Competing for M1)
        {
            "id": "V2",
            "latitude": 30.5015,
            "longitude": 75.8010,
            "acq_date": "2026-10-28",
            "acq_time": "0850",
            "sensor": "VIIRS",
            "frp": 20.0,
        },
        # MODIS_2: 10 km away
        {
            "id": "M2",
            "latitude": 30.5900,
            "longitude": 75.8000,
            "acq_date": "2026-10-28",
            "acq_time": "0830",
            "sensor": "MODIS",
            "frp": 30.0,
        },
        # VIIRS_3: At M2 location, but 4 hours later (1230 UTC)
        {
            "id": "V3",
            "latitude": 30.5900,
            "longitude": 75.8000,
            "acq_date": "2026-10-28",
            "acq_time": "1230",
            "sensor": "VIIRS",
            "frp": 35.0,
        },
    ]

    std_records = standardizer.standardize_records(raw)["data"]
    grid_records = default_spatial_grid.assign_observations_to_grid(std_records)["data"]
    return grid_records


class TestSpatioTemporalMatcher:
    def test_configurable_time_windows(self, sample_grid_records):
        # 30-minute window
        matcher_30 = SpatioTemporalMatcher(time_window_minutes=30.0)
        res_30 = matcher_30.match_observations(sample_grid_records)
        assert res_30["parameters"]["time_window_minutes"] == 30.0
        assert res_30["summary"]["matched_pairs_count"] == 1

        # 60-minute window
        matcher_60 = SpatioTemporalMatcher(time_window_minutes=60.0)
        res_60 = matcher_60.match_observations(sample_grid_records)
        assert res_60["parameters"]["time_window_minutes"] == 60.0
        assert res_60["summary"]["matched_pairs_count"] == 1

        # 120-minute window
        matcher_120 = SpatioTemporalMatcher(time_window_minutes=120.0)
        res_120 = matcher_120.match_observations(sample_grid_records)
        assert res_120["parameters"]["time_window_minutes"] == 120.0

    def test_double_matching_prevention(self, sample_grid_records):
        """
        CRITICAL SCIENTIFIC INTEGRITY RULE:
        Prevent one observation from being incorrectly matched to multiple unrelated observations.
        M1 must pair with V1 (optimal match), and V2 must NOT be paired with M1.
        """
        matcher = SpatioTemporalMatcher(time_window_minutes=60.0, spatial_distance_threshold_m=1500.0)
        result = matcher.match_observations(sample_grid_records)

        matched_groups = result["matched_groups"]
        assert len(matched_groups) == 1
        matched_pair = matched_groups[0]
        assert matched_pair["modis_observation"]["observation_id"] == "M1"
        assert matched_pair["viirs_observation"]["observation_id"] == "V1"

        # Check VIIRS-only and MODIS-only
        modis_only_ids = [m["observation_id"] for m in result["modis_only"]]
        viirs_only_ids = [v["observation_id"] for v in result["viirs_only"]]

        # M2 had no spatial partner within 1.5km at 0830 -> MODIS-only
        assert "M2" in modis_only_ids

        # V2 was close to M1, but M1 was taken by V1 -> V2 preserved as VIIRS-only
        assert "V2" in viirs_only_ids

        # V3 was separated by 4 hours -> preserved as VIIRS-only
        assert "V3" in viirs_only_ids

    def test_non_matched_preservation(self, sample_grid_records):
        """
        CRITICAL SCIENTIFIC INTEGRITY RULE:
        Do not claim that every unmatched detection is a false positive.
        All unmatched detections must be strictly preserved.
        """
        matcher = SpatioTemporalMatcher()
        result = matcher.match_observations(sample_grid_records)

        total_input = len(sample_grid_records)  # 5 observations
        matched_obs_count = len(result["matched_groups"]) * 2  # 1 pair = 2 obs
        modis_only_count = len(result["modis_only"])           # 1 obs
        viirs_only_count = len(result["viirs_only"])           # 2 obs

        assert matched_obs_count + modis_only_count + viirs_only_count == total_input

    def test_exact_boundary_conditions(self):
        """
        Verify that observations sitting exactly on the time window boundary (e.g. delta_t == 60 min)
        are correctly evaluated according to closed-interval mathematical specifications (delta_t <= window),
        while observations exceeding the boundary (e.g. delta_t == 62 min) are excluded.
        """
        raw = [
            # MODIS detection at 10:26 UTC
            {
                "id": "M_BOUND",
                "latitude": 30.5238,
                "longitude": 72.0417,
                "acq_date": "2026-10-26",
                "acq_time": "1026",
                "sensor": "MODIS",
                "frp": 50.0,
            },
            # VIIRS detection exactly 60 minutes earlier at 09:26 UTC (same location)
            {
                "id": "V_EXACT_60",
                "latitude": 30.5238,
                "longitude": 72.0417,
                "acq_date": "2026-10-26",
                "acq_time": "0926",
                "sensor": "VIIRS",
                "frp": 25.0,
            },
            # VIIRS detection 62 minutes earlier at 09:24 UTC
            {
                "id": "V_OVER_62",
                "latitude": 30.5238,
                "longitude": 72.0417,
                "acq_date": "2026-10-26",
                "acq_time": "0924",
                "sensor": "VIIRS",
                "frp": 20.0,
            },
        ]
        std = standardizer.standardize_records(raw)["data"]
        grid = default_spatial_grid.assign_observations_to_grid(std)["data"]

        # At 60 min window: V_EXACT_60 should match M_BOUND, V_OVER_62 excluded
        matcher_60 = SpatioTemporalMatcher(time_window_minutes=60.0)
        res_60 = matcher_60.match_observations(grid)
        assert res_60["summary"]["matched_pairs_count"] == 1
        assert res_60["matched_groups"][0]["modis_observation"]["observation_id"] == "M_BOUND"
        assert res_60["matched_groups"][0]["viirs_observation"]["observation_id"] == "V_EXACT_60"
        assert res_60["matched_groups"][0]["time_delta_min"] == 60.0

        # At 59 min window: Neither should match
        matcher_59 = SpatioTemporalMatcher(time_window_minutes=59.0)
        res_59 = matcher_59.match_observations(grid)
        assert res_59["summary"]["matched_pairs_count"] == 0

        # At 65 min window: V_EXACT_60 still matches (closer cost), V_OVER_62 is VIIRS_only
        matcher_65 = SpatioTemporalMatcher(time_window_minutes=65.0)
        res_65 = matcher_65.match_observations(grid)
        assert res_65["summary"]["matched_pairs_count"] == 1
        assert res_65["matched_groups"][0]["viirs_observation"]["observation_id"] == "V_EXACT_60"


