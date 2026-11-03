"""
Tests for Database Storage & Schema Mapping
NASA Space Apps Challenge 2026 - FireSync
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import date, datetime, timezone
from app.services.harmonizer_engine import MasterHarmonizationEngine
from app.services.spatial_grid import default_spatial_grid


class TestDatabaseStorage:
    @patch("psycopg2.connect")
    def test_persist_daily_calendar_to_db(self, mock_connect):
        """
        Tests that synthesized daily calendar results are persisted to PostgreSQL
        with idempotent ON CONFLICT updates and correct column values.
        """
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_connect.return_value = mock_conn

        engine = MasterHarmonizationEngine()

        daily_calendar = [
            {
                "date": "2026-10-28",
                "observation_counts": {
                    "modis_detection_count": 5,
                    "viirs_detection_count": 10,
                    "matched_observation_groups_count": 4,
                    "modis_only_count": 1,
                    "viirs_only_count": 6,
                    "effective_independent_detections": 11,
                },
                "frp_summaries": {
                    "harmonized_activity_frp_mw": 320.50,
                },
                "estimated_burned_area": {
                    "nominal_ha": 101.8,
                },
            }
        ]

        grid_assigned_records = [
            {"acq_date": "2026-10-28", "latitude": 30.50, "longitude": 75.80},
            {"acq_date": "2026-10-28", "latitude": 30.60, "longitude": 75.90},
        ]

        persisted_count = engine.persist_daily_calendar_to_db(
            daily_calendar=daily_calendar,
            region_name="Punjab Plains",
            spatial_grid_mgr=default_spatial_grid,
            grid_assigned_records=grid_assigned_records,
        )

        assert persisted_count == 1
        assert mock_cur.execute.called

        # Verify SQL statement and parameters
        call_args = mock_cur.execute.call_args[0]
        sql = call_args[0]
        params = call_args[1]

        assert "INSERT INTO harmonized_fire_calendar" in sql
        assert "ON CONFLICT (cluster_id) DO UPDATE" in sql

        # params: (cluster_id, region_name, event_date, event_date, event_date, total_frp, burned_ha, m_count, v_count, consistency, c_lat, c_lon)
        cluster_id = params[0]
        assert cluster_id.startswith("HARM_PUNJAB_PLAINS_20261028_")
        assert params[1] == "Punjab Plains"
        assert params[2] == "2026-10-28"
        assert params[5] == 320.50
        assert params[6] == 101.8
        assert params[7] == 5   # modis
        assert params[8] == 10  # viirs
        assert params[9] == 0.5 # 5 / 10 consistency
        assert pytest.approx(params[10], abs=0.01) == 30.55 # mean lat
        assert pytest.approx(params[11], abs=0.01) == 75.85 # mean lon

    @patch("psycopg2.connect")
    def test_fetch_observations_from_db(self, mock_connect):
        """
        Tests querying observations from PostgreSQL normalized_fires table.
        """
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value = mock_cur
        mock_connect.return_value = mock_conn

        # Mock query return columns & row
        mock_cur.description = [
            ("id",), ("sensor",), ("satellite",), ("instrument",), ("latitude",), ("longitude",),
            ("brightness_kelvin",), ("frp_mw",), ("confidence_raw",), ("confidence_normalized",),
            ("confidence_percent",), ("estimated_internal_score",), ("acq_timestamp",), ("acq_date",),
            ("acq_time",), ("daynight",), ("pixel_footprint_km2",), ("country_code",), ("raw_metadata",)
        ]

        sample_ts = datetime(2026, 10, 28, 8, 30, tzinfo=timezone.utc)
        sample_date = date(2026, 10, 28)
        mock_cur.fetchall.return_value = [
            (
                "obs-uuid-1", "MODIS", "Terra", "MODIS", 30.5, 75.8,
                335.5, 45.2, "85", "HIGH", 85, 85, sample_ts, sample_date,
                "0830", "D", 1.0, "IND", {}
            )
        ]

        engine = MasterHarmonizationEngine()
        records = engine.fetch_observations_from_db(country_code="IND", start_date="2026-10-28", end_date="2026-10-31")

        assert len(records) == 1
        r = records[0]
        assert r["id"] == "obs-uuid-1"
        assert r["sensor"] == "MODIS"
        assert r["acq_timestamp_utc"] == sample_ts.isoformat()
        assert r["acq_date"] == "2026-10-28"
        assert r["frp_mw"] == 45.2

