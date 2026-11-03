"""
Spatio-Temporal DBSCAN (ST-DBSCAN) Clustering Service
NASA Space Apps Challenge 2026 - FireSync
Clusters active-fire satellite detections across Equal-Area space and time into discrete fire complexes.
"""

import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from app.services.spatial_grid import default_spatial_grid, SpatialGridManager
from app.services.daily_aggregator import default_daily_aggregator
from app.models.schemas import HarmonizedClusterSummary

logger = logging.getLogger("firesync.dbscan")


class SpatioTemporalDBSCAN:
    """
    Spatio-Temporal Density-Based Spatial Clustering of Applications with Noise (ST-DBSCAN).
    Clusters multi-sensor active-fire detections using metric Euclidean distance in Equal-Area meters
    and temporal difference in days/hours.
    """

    def __init__(
        self,
        spatial_eps_m: float = 1500.0,
        temporal_eps_days: float = 2.0,
        min_samples: int = 2,
    ):
        """
        :param spatial_eps_m: Maximum spatial distance in Equal Earth projected meters (default 1500 m).
        :param temporal_eps_days: Maximum time separation in days (default 2 days / 48 hours).
        :param min_samples: Minimum detections to form a density core (default 2).
        """
        self.spatial_eps_m = float(spatial_eps_m)
        self.temporal_eps_seconds = float(temporal_eps_days) * 86400.0
        self.min_samples = int(min_samples)

    @staticmethod
    def _parse_timestamp_seconds(record: Dict[str, Any]) -> float:
        """Extracts UNIX epoch timestamp in seconds from observation."""
        ts = record.get("acq_timestamp_utc") or record.get("acq_timestamp")
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            return ts.timestamp()

        if ts:
            try:
                dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                return dt.timestamp()
            except Exception:
                pass

        # Fallback to acq_date YYYY-MM-DD
        date_str = str(record.get("acq_date") or record.get("date") or "2026-01-01")
        time_str = str(record.get("acq_time") or record.get("time") or "0000").zfill(4)[:4]
        try:
            dt = datetime(
                int(date_str[:4]),
                int(date_str[5:7]),
                int(date_str[8:10]),
                int(time_str[:2]),
                int(time_str[2:4]),
                tzinfo=timezone.utc,
            )
            return dt.timestamp()
        except Exception:
            return 0.0

    def cluster_observations(
        self,
        observations: List[Dict[str, Any]],
        region_name: str = "FireSync Region",
        spatial_grid: Optional[SpatialGridManager] = None,
    ) -> Dict[str, Any]:
        """
        Executes ST-DBSCAN clustering across space and time.
        Returns cluster assignments, cluster summaries, and noise points.
        """
        if not observations:
            return {
                "success": True,
                "region_name": region_name,
                "total_observations": 0,
                "clusters_found": 0,
                "clusters": [],
                "noise_count": 0,
            }

        grid = spatial_grid or default_spatial_grid

        # 1. Ensure Equal Earth projected coordinates (proj_x, proj_y) and timestamps
        n = len(observations)
        xs = np.zeros(n, dtype=float)
        ys = np.zeros(n, dtype=float)
        ts = np.zeros(n, dtype=float)

        for i, obs in enumerate(observations):
            if "proj_x" in obs and "proj_y" in obs:
                xs[i] = float(obs["proj_x"])
                ys[i] = float(obs["proj_y"])
            else:
                lon = float(obs.get("longitude") or obs.get("lon") or 0.0)
                lat = float(obs.get("latitude") or obs.get("lat") or 0.0)
                px, py = grid.project_point(lon, lat)
                xs[i] = px
                ys[i] = py

            ts[i] = self._parse_timestamp_seconds(obs)

        # 2. Neighborhood discovery function
        # A point j is a neighbor of i if Euclidean distance <= spatial_eps_m AND time delta <= temporal_eps_seconds
        def get_neighbors(i: int) -> List[int]:
            dx = xs - xs[i]
            dy = ys - ys[i]
            dist_sq = dx * dx + dy * dy
            dt = np.abs(ts - ts[i])
            spatial_mask = dist_sq <= (self.spatial_eps_m * self.spatial_eps_m)
            temporal_mask = dt <= self.temporal_eps_seconds
            neighbors = np.where(spatial_mask & temporal_mask)[0]
            return neighbors.tolist()

        # 3. Density clustering
        labels = np.full(n, -1, dtype=int)  # -1 = unassigned / noise
        cluster_id_counter = 0

        for i in range(n):
            if labels[i] != -1:
                continue

            neighbors = get_neighbors(i)
            if len(neighbors) < self.min_samples:
                # Mark as noise initially (might be absorbed by another core point later)
                continue

            # Start new cluster
            current_cluster = cluster_id_counter
            labels[i] = current_cluster

            # Expand cluster queue
            queue = [idx for idx in neighbors if idx != i]
            visited_in_cluster = {i}

            while queue:
                current_point = queue.pop(0)
                if current_point in visited_in_cluster:
                    continue
                visited_in_cluster.add(current_point)

                # If previously noise or unassigned, adopt into current cluster
                labels[current_point] = current_cluster

                current_neighbors = get_neighbors(current_point)
                if len(current_neighbors) >= self.min_samples:
                    for cn in current_neighbors:
                        if cn not in visited_in_cluster:
                            queue.append(cn)

            cluster_id_counter += 1

        # 4. Synthesize cluster summaries
        clusters: List[HarmonizedClusterSummary] = []
        unique_labels = [lbl for lbl in sorted(list(set(labels))) if lbl >= 0]

        for lbl in unique_labels:
            indices = np.where(labels == lbl)[0]
            cluster_records = [observations[idx] for idx in indices]

            # Sensor counts
            modis_count = sum(1 for r in cluster_records if "MODIS" in str(r.get("sensor", "")).upper())
            viirs_count = sum(1 for r in cluster_records if "VIIRS" in str(r.get("sensor", "")).upper())

            # FRP and dates
            frps = [float(r.get("frp_mw") or r.get("frp") or 0.0) for r in cluster_records]
            total_frp = round(float(sum(frps)), 2)

            # Dates
            dates = [str(r.get("acq_date") or r.get("date") or "2026-01-01") for r in cluster_records]
            sorted_dates = sorted(dates)
            event_start = sorted_dates[0]
            event_end = sorted_dates[-1]

            # Peak burning date: date with maximum daily total FRP
            daily_frps: Dict[str, float] = {}
            for d, f in zip(dates, frps):
                daily_frps[d] = daily_frps.get(d, 0.0) + f
            peak_date = max(daily_frps.items(), key=lambda kv: kv[1])[0]

            # Centroid in geographic degrees
            lats = [float(r.get("latitude") if r.get("latitude") is not None else r.get("lat")) for r in cluster_records]
            lons = [float(r.get("longitude") if r.get("longitude") is not None else r.get("lon")) for r in cluster_records]
            c_lat = round(float(np.mean(lats)), 4)
            c_lon = round(float(np.mean(lons)), 4)

            # Estimated burned area via Wooster FRE
            area_est = default_daily_aggregator.calculate_burned_area_ha(total_frp)

            # Cross-sensor consistency
            consistency = (
                round(min(modis_count, viirs_count) / max(modis_count, viirs_count), 3)
                if max(modis_count, viirs_count) > 0
                else 0.0
            )

            cid = f"CLUST_{region_name.upper().replace(' ', '_')[:12]}_{lbl+1:03d}"

            cluster_summary = HarmonizedClusterSummary(
                cluster_id=cid,
                region_name=region_name,
                event_start_date=event_start,
                event_end_date=event_end,
                peak_burning_date=peak_date,
                modis_detections=modis_count,
                viirs_detections=viirs_count,
                total_frp_mw=total_frp,
                estimated_burned_area_ha=float(area_est["nominal_ha"]),
                sensor_consistency_index=consistency,
                centroid_lat=c_lat,
                centroid_lon=c_lon,
            )
            clusters.append(cluster_summary)

        noise_count = int(np.sum(labels == -1))

        return {
            "success": True,
            "region_name": region_name,
            "parameters": {
                "spatial_eps_m": self.spatial_eps_m,
                "temporal_eps_days": self.temporal_eps_seconds / 86400.0,
                "min_samples": self.min_samples,
            },
            "total_observations": n,
            "clusters_found": len(clusters),
            "clusters": clusters,
            "noise_count": noise_count,
            "labels": labels.tolist(),
        }


default_st_dbscan = SpatioTemporalDBSCAN()

