"""
Tests for Stage 2: Spatial Harmonization & Equal-Area Common Grid Service
"""

import pytest
import math
from app.services.spatial_grid import SpatialGridManager, default_spatial_grid
from app.services.standardizer import standardizer


class TestSpatialGridManager:
    def test_grid_initialization(self):
        grid = SpatialGridManager(target_crs="EPSG:8857", grid_resolution_m=1000.0)
        assert grid.target_crs == "EPSG:8857"
        assert grid.grid_resolution_m == 1000.0

    def test_project_and_unproject_roundtrip(self):
        grid = default_spatial_grid
        test_lon = 75.8572
        test_lat = 30.9010

        x, y = grid.project_point(test_lon, test_lat)
        assert isinstance(x, float)
        assert isinstance(y, float)

        # Inverse transform
        lon_back, lat_back = grid.unproject_point(x, y)
        assert pytest.approx(lon_back, abs=1e-4) == test_lon
        assert pytest.approx(lat_back, abs=1e-4) == test_lat

    def test_cell_indexing_and_bounds(self):
        grid = default_spatial_grid
        # Pick arbitrary coordinates in Punjab
        x, y = grid.project_point(75.8, 30.9)
        col, row = grid.get_cell_indices(x, y)

        cell_id = grid.generate_cell_id(col, row)
        assert cell_id.startswith("G1KM_")

        min_x, min_y, max_x, max_y = grid.get_cell_bounds_projected(col, row)
        assert max_x - min_x == 1000.0
        assert max_y - min_y == 1000.0
        assert min_x <= x <= max_x
        assert min_y <= y <= max_y

        cx, cy, clon, clat = grid.get_cell_centroid(col, row)
        assert cx == (min_x + max_x) / 2.0
        assert cy == (min_y + max_y) / 2.0

    def test_assign_observations_to_grid(self):
        grid = default_spatial_grid
        records = [
            {
                "latitude": 30.500,
                "longitude": 75.800,
                "acq_date": "2026-10-28",
                "acq_time": "0830",
                "sensor": "MODIS",
                "frp": 25.0,
            },
            {
                "latitude": 30.502,  # Nearby (< 300m away, likely same or adjacent cell)
                "longitude": 75.802,
                "acq_date": "2026-10-28",
                "acq_time": "0832",
                "sensor": "VIIRS",
                "frp": 12.0,
            },
        ]

        std_records = standardizer.standardize_records(records)["data"]
        result = grid.assign_observations_to_grid(std_records)

        assert result["success"] is True
        assert result["total_observations_assigned"] == 2
        assigned_data = result["data"]

        # Ensure original coordinates are strictly preserved
        assert assigned_data[0]["latitude"] == 30.500
        assert assigned_data[0]["longitude"] == 75.800
        assert "cell_id" in assigned_data[0]
        assert "proj_x" in assigned_data[0]
        assert "proj_y" in assigned_data[0]

        # Ensure scientific documentation is included
        assert "limitations_of_centroid_assignment" in result["scientific_documentation"]
        assert "intra_cell_fire_independence" in result["scientific_documentation"]

