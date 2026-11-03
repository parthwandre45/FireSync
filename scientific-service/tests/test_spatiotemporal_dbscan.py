"""
Tests for Spatio-Temporal DBSCAN (ST-DBSCAN) Clustering
NASA Space Apps Challenge 2026 - FireSync
"""

import pytest
from app.services.dbscan_clustering import SpatioTemporalDBSCAN, default_st_dbscan
from app.services.harmonizer import SatelliteHarmonizerService
from app.models.schemas import HarmonizeRequest


class TestSpatioTemporalDBSCAN:
    def test_cluster_dense_spatiotemporal_events(self):
        """
        Creates two distinct fire complexes:
        Cluster A: Punjab West (lat 30.50, lon 75.80), Oct 28
        Cluster B: Punjab East (lat 31.20, lon 76.50 - ~80 km away), Oct 28
        """
        cluster_a = [
            {"sensor": "MODIS", "latitude": 30.5000, "longitude": 75.8000, "frp": 50.0, "acq_date": "2026-10-28", "acq_time": "0830"},
            {"sensor": "VIIRS", "latitude": 30.5050, "longitude": 75.8050, "frp": 45.0, "acq_date": "2026-10-28", "acq_time": "0845"},
            {"sensor": "VIIRS", "latitude": 30.5080, "longitude": 75.8080, "frp": 30.0, "acq_date": "2026-10-29", "acq_time": "0830"}, # Next day, same fire front
        ]

        cluster_b = [
            {"sensor": "MODIS", "latitude": 31.2000, "longitude": 76.5000, "frp": 70.0, "acq_date": "2026-10-28", "acq_time": "0830"},
            {"sensor": "VIIRS", "latitude": 31.2040, "longitude": 76.5040, "frp": 60.0, "acq_date": "2026-10-28", "acq_time": "0845"},
        ]

        all_obs = cluster_a + cluster_b
        clusterer = SpatioTemporalDBSCAN(spatial_eps_m=2000.0, temporal_eps_days=2.0, min_samples=2)
        res = clusterer.cluster_observations(all_obs, region_name="Punjab Plains")

        assert res["success"] is True
        assert res["total_observations"] == 5
        assert res["clusters_found"] == 2
        assert res["noise_count"] == 0

        # Cluster A should have 3 detections (1 MODIS + 2 VIIRS)
        c0 = res["clusters"][0]
        assert c0.modis_detections in [1, 1]
        assert c0.viirs_detections in [1, 2]

        # Centroid should be within plausible Punjab bounds
        for c in res["clusters"]:
            assert 30.0 <= c.centroid_lat <= 32.0
            assert 75.0 <= c.centroid_lon <= 77.0
            assert c.total_frp_mw > 0.0
            assert c.estimated_burned_area_ha > 0.0

    def test_temporal_separation_splits_clusters(self):
        """
        Two fires at the EXACT same location, but separated by 10 days.
        They must NOT be clustered into the same fire event.
        """
        fire_event_1 = [
            {"sensor": "MODIS", "latitude": 30.5000, "longitude": 75.8000, "frp": 40.0, "acq_date": "2026-10-10", "acq_time": "0830"},
            {"sensor": "VIIRS", "latitude": 30.5020, "longitude": 75.8020, "frp": 35.0, "acq_date": "2026-10-10", "acq_time": "0840"},
        ]
        fire_event_2 = [
            {"sensor": "MODIS", "latitude": 30.5000, "longitude": 75.8000, "frp": 55.0, "acq_date": "2026-10-20", "acq_time": "0830"},
            {"sensor": "VIIRS", "latitude": 30.5020, "longitude": 75.8020, "frp": 48.0, "acq_date": "2026-10-20", "acq_time": "0840"},
        ]

        obs = fire_event_1 + fire_event_2
        clusterer = SpatioTemporalDBSCAN(spatial_eps_m=1500.0, temporal_eps_days=2.0, min_samples=2)
        res = clusterer.cluster_observations(obs)

        assert res["clusters_found"] == 2  # Separated by 10 days -> 2 distinct events

    def test_noise_identification_for_isolated_burns(self):
        """
        A single isolated detection far away in space/time with min_samples=2 should be marked as noise.
        """
        isolated = [
            {"sensor": "MODIS", "latitude": 28.5000, "longitude": 77.2000, "frp": 15.0, "acq_date": "2026-10-28", "acq_time": "0830"}
        ]
        clusterer = SpatioTemporalDBSCAN(spatial_eps_m=1500.0, temporal_eps_days=2.0, min_samples=2)
        res = clusterer.cluster_observations(isolated)

        assert res["clusters_found"] == 0
        assert res["noise_count"] == 1

    def test_harmonizer_service_integration(self):
        """Tests end-to-end integration with SatelliteHarmonizerService."""
        req = HarmonizeRequest(
            region_name="Test Indo-Gangetic Corridor",
            start_date="2026-10-28",
            end_date="2026-10-30",
            spatial_threshold_km=2.0,
            temporal_threshold_days=2,
        )

        test_data = [
            {"sensor": "MODIS", "lat": 30.50, "lon": 75.80, "frp": 45.0, "acq_date": "2026-10-28", "acq_time": "0830"},
            {"sensor": "VIIRS", "lat": 30.51, "lon": 75.81, "frp": 52.0, "acq_date": "2026-10-28", "acq_time": "0845"},
            {"sensor": "VIIRS", "lat": 30.50, "lon": 75.80, "frp": 38.0, "acq_date": "2026-10-29", "acq_time": "0835"},
        ]

        res = SatelliteHarmonizerService.process_harmonization(req, observations=test_data)
        assert res.success is True
        assert res.clusters_found >= 1
        assert len(res.clusters) >= 1
        c = res.clusters[0]
        assert c.modis_detections == 1
        assert c.viirs_detections == 2
        assert c.total_frp_mw == 135.0

