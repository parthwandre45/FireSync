"""
Stage 2: Spatial Harmonization & Equal-Area Common Grid Service
NASA Space Apps Challenge 2026 - FireSync
"""

import math
import logging
from typing import Dict, Any, List, Optional, Tuple
import pyproj
from pyproj import Transformer
from shapely.geometry import Point, box, Polygon
from app.core.constants import (
    DEFAULT_GLOBAL_EQUAL_AREA_CRS,
    DEFAULT_NOMINAL_GRID_RESOLUTION_M,
    WGS84_CRS,
    SCIENTIFIC_DISCLAIMER,
)

logger = logging.getLogger("firesync.spatial_grid")

class SpatialGridManager:
    """
    Stage 2 Service: Projects satellite observations into a mathematically rigorous Equal-Area CRS
    and assigns them to deterministic spatial grid cells while preserving original coordinates.
    """

    def __init__(
        self,
        target_crs: str = DEFAULT_GLOBAL_EQUAL_AREA_CRS,
        grid_resolution_m: float = DEFAULT_NOMINAL_GRID_RESOLUTION_M,
    ):
        """
        Initializes the spatial grid manager with a specific Equal-Area CRS and resolution.
        
        CRITICAL SCIENTIFIC PRINCIPLE:
        Latitude/longitude angular degrees are NOT equal-area; degree length shrinks with cos(latitude).
        Therefore, an Equal-Area projection (such as Equal Earth EPSG:8857 or Albers Equal Area) MUST be
        used to ensure that every 1 km x 1 km cell on Earth covers exactly 1 km^2 (100 hectares).
        """
        self.target_crs = target_crs
        self.grid_resolution_m = float(grid_resolution_m)

        # Transformer from WGS84 (lon, lat) to Equal-Area (x, y) meters
        # always_xy=True ensures (longitude, latitude) -> (x, y) order regardless of authority axis order
        self.forward_transformer = Transformer.from_crs(WGS84_CRS, self.target_crs, always_xy=True)
        self.inverse_transformer = Transformer.from_crs(self.target_crs, WGS84_CRS, always_xy=True)

    def project_point(self, lon: float, lat: float) -> Tuple[float, float]:
        """Projects WGS84 (longitude, latitude) into Equal-Area planar coordinates (x, y) in meters."""
        x, y = self.forward_transformer.transform(lon, lat)
        return (x, y)

    def unproject_point(self, x: float, y: float) -> Tuple[float, float]:
        """Inverse transforms Equal-Area planar (x, y) back to WGS84 (longitude, latitude)."""
        lon, lat = self.inverse_transformer.transform(x, y)
        return (lon, lat)

    def get_cell_indices(self, x: float, y: float) -> Tuple[int, int]:
        """
        Calculates discrete integer grid coordinates (col_i, row_j) for planar coordinate (x, y).
        Standardized origin (0, 0) at projection origin.
        """
        col_i = math.floor(x / self.grid_resolution_m)
        row_j = math.floor(y / self.grid_resolution_m)
        return (col_i, row_j)

    def generate_cell_id(self, col_i: int, row_j: int) -> str:
        """Generates a deterministic, reproducible string cell identifier."""
        res_km = int(round(self.grid_resolution_m / 1000.0))
        # Format: G{res}KM_{col}_{row}
        return f"G{res_km}KM_{col_i:+08d}_{row_j:+08d}"

    def get_cell_bounds_projected(self, col_i: int, row_j: int) -> Tuple[float, float, float, float]:
        """Returns projected bounding box in meters: (min_x, min_y, max_x, max_y)."""
        min_x = col_i * self.grid_resolution_m
        min_y = row_j * self.grid_resolution_m
        max_x = min_x + self.grid_resolution_m
        max_y = min_y + self.grid_resolution_m
        return (min_x, min_y, max_x, max_y)

    def get_cell_centroid(self, col_i: int, row_j: int) -> Tuple[float, float, float, float]:
        """
        Returns cell center in both projected meters (center_x, center_y)
        and geographic coordinates (center_lon, center_lat).
        """
        min_x, min_y, max_x, max_y = self.get_cell_bounds_projected(col_i, row_j)
        cx = (min_x + max_x) / 2.0
        cy = (min_y + max_y) / 2.0
        clon, clat = self.unproject_point(cx, cy)
        return (cx, cy, round(clon, 6), round(clat, 6))

    def assign_observations_to_grid(
        self, standardized_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Assigns each standardized observation to an Equal-Area spatial grid cell.
        Preserves original geographic coordinates, projected coordinates, and cell geometry.
        """
        enriched_records: List[Dict[str, Any]] = []
        cell_aggregation: Dict[str, Dict[str, Any]] = {}

        for r in standardized_records:
            lon = float(r["longitude"])
            lat = float(r["latitude"])

            # 1. Project to Equal-Area plane
            proj_x, proj_y = self.project_point(lon, lat)

            # 2. Compute discrete grid cell
            col_i, row_j = self.get_cell_indices(proj_x, proj_y)
            cell_id = self.generate_cell_id(col_i, row_j)
            cx_m, cy_m, clon, clat = self.get_cell_centroid(col_i, row_j)

            # Copy and enrich observation record
            rec = dict(r)
            rec.update({
                "proj_x": round(proj_x, 2),
                "proj_y": round(proj_y, 2),
                "grid_col_i": col_i,
                "grid_row_j": row_j,
                "cell_id": cell_id,
                "cell_centroid_lon": clon,
                "cell_centroid_lat": clat,
                "spatial_crs": self.target_crs,
                "grid_resolution_m": self.grid_resolution_m,
            })
            enriched_records.append(rec)

            # 3. Track cell-level index
            if cell_id not in cell_aggregation:
                min_x, min_y, max_x, max_y = self.get_cell_bounds_projected(col_i, row_j)
                cell_aggregation[cell_id] = {
                    "cell_id": cell_id,
                    "grid_col_i": col_i,
                    "grid_row_j": row_j,
                    "centroid_lon": clon,
                    "centroid_lat": clat,
                    "bounds_projected_m": {"min_x": min_x, "min_y": min_y, "max_x": max_x, "max_y": max_y},
                    "modis_count": 0,
                    "viirs_count": 0,
                    "total_frp_mw": 0.0,
                    "observations": [],
                }

            cell = cell_aggregation[cell_id]
            sensor = r["sensor"]
            if sensor == "MODIS":
                cell["modis_count"] += 1
            elif sensor == "VIIRS":
                cell["viirs_count"] += 1
            cell["total_frp_mw"] += float(r.get("frp_mw") or 0.0)
            cell["observations"].append(rec["observation_id"])

        # Format cell summary list
        cells_list = list(cell_aggregation.values())
        for c in cells_list:
            c["total_frp_mw"] = round(c["total_frp_mw"], 2)

        return {
            "success": True,
            "grid_parameters": {
                "spatial_crs": self.target_crs,
                "grid_resolution_m": self.grid_resolution_m,
                "nominal_area_km2": round((self.grid_resolution_m / 1000.0) ** 2, 4),
                "nominal_area_ha": round(((self.grid_resolution_m / 1000.0) ** 2) * 100.0, 2),
            },
            "total_observations_assigned": len(enriched_records),
            "total_unique_cells_occupied": len(cells_list),
            "data": enriched_records,
            "cells_summary": cells_list,
            "scientific_documentation": {
                "limitations_of_centroid_assignment": (
                    "Observations are assigned to grid cells based on their detection centroid coordinates. "
                    "However, satellite active-fire detections represent integrated footprints over surface areas "
                    "(nominal ~1 km for MODIS, expanding to ~4.8 km x ~2.0 km at swath edge due to the bow-tie effect; "
                    "and 375 m for VIIRS). A fire detection near a cell boundary likely extends into adjacent cells. "
                    "Centroid-based indexing is a spatial discrete reference tool and does not imply the active "
                    "combustion was confined solely within the boundaries of that single cell."
                ),
                "intra_cell_fire_independence": (
                    "Observations within the same grid cell MUST NOT be assumed to represent the same individual fire. "
                    "A single 1 km² cell can contain multiple separate agricultural burn piles, separate wildland ignitions, "
                    "or independent advancing fire fronts."
                ),
            },
        }

default_spatial_grid = SpatialGridManager()

