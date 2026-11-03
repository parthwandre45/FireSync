"""
Stage 3: Spatio-Temporal Observation Matching Service
NASA Space Apps Challenge 2026 - FireSync
"""

import math
import logging
import bisect
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple, Set
import numpy as np

logger = logging.getLogger("firesync.temporal_matcher")

class SpatioTemporalMatcher:
    """
    Stage 3 Service: Evaluates spatial and temporal proximity between MODIS and VIIRS active-fire detections.
    Identifies coincident observations, preserves sensor-only detections, and prevents multi-matching.
    """

    def __init__(
        self,
        time_window_minutes: float = 60.0,
        spatial_distance_threshold_m: float = 1500.0,
        temporal_weight: float = 0.5,
    ):
        """
        Initializes matcher.
        :param time_window_minutes: Maximum allowable time difference between observations (e.g. 30, 60, 120 min).
        :param spatial_distance_threshold_m: Maximum Euclidean distance in equal-area projection meters (default 1.5 km).
        :param temporal_weight: Weight of temporal difference relative to spatial distance in cost function.
        """
        self.time_window_minutes = float(time_window_minutes)
        self.spatial_distance_threshold_m = float(spatial_distance_threshold_m)
        self.temporal_weight = float(temporal_weight)

    def match_observations(
        self, grid_assigned_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes mutual bipartite matching between MODIS and VIIRS active fire detections.
        Preserves MODIS-only and VIIRS-only observations.
        Prevents one observation from being incorrectly matched to multiple unrelated observations.
        """
        # Separate observations by sensor
        modis_records = [r for r in grid_assigned_records if r.get("sensor") == "MODIS"]
        viirs_records = [r for r in grid_assigned_records if r.get("sensor") == "VIIRS"]

        # Parse UTC timestamps
        def get_dt(r: Dict[str, Any]) -> datetime:
            ts = r.get("acq_timestamp_utc")
            if isinstance(ts, datetime):
                return ts
            return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))

        modis_times = [get_dt(r) for r in modis_records]
        viirs_times = [get_dt(r) for r in viirs_records]

        # Candidate pair generation
        candidate_matches: List[Dict[str, Any]] = []
        max_time_sec = self.time_window_minutes * 60.0
        max_delta = timedelta(seconds=max_time_sec)

        # Pre-index VIIRS by timestamp for fast temporal window candidate selection
        sorted_v_order = sorted(range(len(viirs_records)), key=lambda idx: viirs_times[idx])
        sorted_v_times = [viirs_times[idx] for idx in sorted_v_order]

        for m_idx, m_rec in enumerate(modis_records):
            m_x = float(m_rec["proj_x"])
            m_y = float(m_rec["proj_y"])
            m_time = modis_times[m_idx]

            # Binary search to find candidate VIIRS records within [m_time - max_delta, m_time + max_delta]
            start_idx = bisect.bisect_left(sorted_v_times, m_time - max_delta)
            end_idx = bisect.bisect_right(sorted_v_times, m_time + max_delta)

            for order_idx in range(start_idx, end_idx):
                v_idx = sorted_v_order[order_idx]
                v_rec = viirs_records[v_idx]
                v_time = sorted_v_times[order_idx]
                time_delta_sec = abs((m_time - v_time).total_seconds())

                # Strict temporal gate
                if time_delta_sec > max_time_sec:
                    continue

                v_x = float(v_rec["proj_x"])
                v_y = float(v_rec["proj_y"])

                # Spatial Euclidean distance in equal-area plane (meters)
                spatial_dist_m = math.sqrt((m_x - v_x) ** 2 + (m_y - v_y) ** 2)

                # Spatial gate
                if spatial_dist_m > self.spatial_distance_threshold_m:
                    continue

                # Normalized combined spatio-temporal cost (0.0 = perfect match, higher = more distant)
                norm_spatial = spatial_dist_m / self.spatial_distance_threshold_m
                norm_temporal = time_delta_sec / max_time_sec if max_time_sec > 0 else 0.0
                cost = (1.0 - self.temporal_weight) * norm_spatial + self.temporal_weight * norm_temporal

                candidate_matches.append({
                    "modis_idx": m_idx,
                    "viirs_idx": v_idx,
                    "modis_id": m_rec["observation_id"],
                    "viirs_id": v_rec["observation_id"],
                    "spatial_distance_m": round(spatial_dist_m, 2),
                    "time_delta_sec": round(time_delta_sec, 1),
                    "time_delta_min": round(time_delta_sec / 60.0, 2),
                    "cost": round(cost, 4),
                })

        # Sort candidate matches by ascending cost (greedy minimum-cost matching)
        candidate_matches.sort(key=lambda c: c["cost"])

        matched_groups: List[Dict[str, Any]] = []
        matched_modis_indices: Set[int] = set()
        matched_viirs_indices: Set[int] = set()

        for c in candidate_matches:
            m_idx = c["modis_idx"]
            v_idx = c["viirs_idx"]

            # PREVENT DOUBLE-MATCHING:
            # If either the MODIS or VIIRS detection has already been matched to an optimal candidate,
            # do not match it again to an unrelated observation.
            if m_idx in matched_modis_indices or v_idx in matched_viirs_indices:
                continue

            matched_modis_indices.add(m_idx)
            matched_viirs_indices.add(v_idx)

            group_id = f"MATCH_{c['modis_id']}_{c['viirs_id']}"
            m_rec = modis_records[m_idx]
            v_rec = viirs_records[v_idx]

            matched_groups.append({
                "group_id": group_id,
                "modis_observation": m_rec,
                "viirs_observation": v_rec,
                "spatial_distance_m": c["spatial_distance_m"],
                "time_delta_sec": c["time_delta_sec"],
                "time_delta_min": c["time_delta_min"],
                "cost_index": c["cost"],
                "modis_frp_mw": m_rec["frp_mw"],
                "viirs_frp_mw": v_rec["frp_mw"],
                "frp_ratio_viirs_to_modis": round(v_rec["frp_mw"] / m_rec["frp_mw"], 3) if m_rec["frp_mw"] > 0 else None,
                "acq_date": m_rec["acq_date"],
                "grid_cell_id": m_rec["cell_id"],
            })

        # Isolate MODIS-only detections
        modis_only_records: List[Dict[str, Any]] = []
        for idx, m_rec in enumerate(modis_records):
            rec = dict(m_rec)
            if idx in matched_modis_indices:
                rec["match_status"] = "MATCHED"
            else:
                rec["match_status"] = "MODIS_ONLY"
                modis_only_records.append(rec)

        # Isolate VIIRS-only detections
        viirs_only_records: List[Dict[str, Any]] = []
        for idx, v_rec in enumerate(viirs_records):
            rec = dict(v_rec)
            if idx in matched_viirs_indices:
                rec["match_status"] = "MATCHED"
            else:
                rec["match_status"] = "VIIRS_ONLY"
                viirs_only_records.append(rec)

        # Calculate metrics
        avg_spatial_dist = (
            round(float(np.mean([g["spatial_distance_m"] for g in matched_groups])), 2)
            if matched_groups
            else 0.0
        )
        avg_time_delta_min = (
            round(float(np.mean([g["time_delta_min"] for g in matched_groups])), 2)
            if matched_groups
            else 0.0
        )

        return {
            "success": True,
            "parameters": {
                "time_window_minutes": self.time_window_minutes,
                "spatial_distance_threshold_m": self.spatial_distance_threshold_m,
                "temporal_weight": self.temporal_weight,
            },
            "summary": {
                "total_modis_records": len(modis_records),
                "total_viirs_records": len(viirs_records),
                "matched_pairs_count": len(matched_groups),
                "modis_only_count": len(modis_only_records),
                "viirs_only_count": len(viirs_only_records),
                "modis_match_rate_pct": round((len(matched_groups) / len(modis_records) * 100.0), 2) if modis_records else 0.0,
                "viirs_match_rate_pct": round((len(matched_groups) / len(viirs_records) * 100.0), 2) if viirs_records else 0.0,
                "average_spatial_separation_m": avg_spatial_dist,
                "average_temporal_separation_min": avg_time_delta_min,
            },
            "matched_groups": matched_groups,
            "modis_only": modis_only_records,
            "viirs_only": viirs_only_records,
            "scientific_notes": {
                "non_matched_validity": (
                    "Unmatched observations are explicitly preserved and must NOT be categorized as false positives. "
                    "Unmatched detections occur routinely due to satellite overpass time differences (e.g. Terra vs Suomi-NPP "
                    "overpass separation by ~3 hours), fire growth or extinguishment between overpasses, cloud motion, and "
                    "the greater sensitivity of VIIRS 375m detectors to sub-pixel cooler burning that fails MODIS 1km thresholds."
                ),
                "double_matching_prevention": (
                    "A bipartite mutual nearest-neighbor optimization was enforced. Each individual MODIS and VIIRS detection "
                    "is paired at most once with its lowest spatio-temporal cost partner, preventing artificial inflated "
                    "fire counts or duplicate pairing across multiple nearby detections."
                ),
            },
        }

default_temporal_matcher = SpatioTemporalMatcher()

