"""
Stage 5: Daily Harmonized Activity Aggregation Service
NASA Space Apps Challenge 2026 - FireSync
"""

import math
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.constants import (
    WOOSTER_BIOMASS_CONVERSION_KG_PER_MJ,
    NOMINAL_FUEL_CONSUMPTION_TONS_PER_HA,
    SCIENTIFIC_DISCLAIMER,
)

logger = logging.getLogger("firesync.daily_aggregator")

class DailyHarmonizedAggregator:
    """
    Stage 5 Service: Synthesizes daily activity summaries at both grid-cell and regional scales.
    Enforces scientific integrity: avoids count double-counting, preserves sensor independence,
    and documents data availability and physical uncertainties.
    """

    @staticmethod
    def calculate_burned_area_ha(frp_mw_sum: float, duration_hours: float = 6.0) -> Dict[str, float]:
        """
        Estimates burned area using Fire Radiative Energy (FRE) conversion (Wooster et al. 2005).
        FRE (MJ) = FRP (MW) * 1e6 W * (duration_hours * 3600 s) * 1e-6 MJ/J = FRP * duration_hours * 3600
        Dry Biomass Consumed (kg) = FRE (MJ) * C_b (0.368 kg/MJ)
        Estimated Area (ha) = Biomass Consumed (tons) / (Fuel consumption density tons/ha)
        """
        if frp_mw_sum <= 0:
            return {"nominal_ha": 0.0, "lower_bound_ha": 0.0, "upper_bound_ha": 0.0}

        fre_mj = frp_mw_sum * (duration_hours * 3600.0)
        biomass_kg = fre_mj * WOOSTER_BIOMASS_CONVERSION_KG_PER_MJ
        biomass_tons = biomass_kg / 1000.0

        # Nominal area (using 25 tons/ha fuel load)
        nominal_ha = biomass_tons / NOMINAL_FUEL_CONSUMPTION_TONS_PER_HA
        # Uncertainty bounds reflecting 15 to 45 tons/ha variable fuel density
        lower_ha = biomass_tons / 45.0  # Dense fuel consumes less area per ton
        upper_ha = biomass_tons / 15.0  # Sparse grass consumes more area per ton

        return {
            "nominal_ha": round(nominal_ha, 1),
            "lower_bound_ha": round(lower_ha, 1),
            "upper_bound_ha": round(upper_ha, 1),
        }

    def aggregate_daily_activity(
        self,
        grid_assigned_records: List[Dict[str, Any]],
        temporal_matching_result: Dict[str, Any],
        calibration_result: Optional[Dict[str, Any]] = None,
        region_name: str = "India Regional Corridor",
    ) -> Dict[str, Any]:
        """
        Synthesizes daily activity summary across all observations, broken down by date and grid cell.
        """
        matched_groups = temporal_matching_result.get("matched_groups", [])
        modis_only = temporal_matching_result.get("modis_only", [])
        viirs_only = temporal_matching_result.get("viirs_only", [])

        # Group observations by date
        dates = sorted(list(set(r.get("acq_date") for r in grid_assigned_records if r.get("acq_date"))))
        if not dates:
            dates = ["2026-10-31"]

        daily_summaries = []

        # Index matched groups by (date, cell_id)
        matched_by_date = {}
        for g in matched_groups:
            d = g.get("acq_date")
            matched_by_date.setdefault(d, []).append(g)

        modis_only_by_date = {}
        for m in modis_only:
            d = m.get("acq_date")
            modis_only_by_date.setdefault(d, []).append(m)

        viirs_only_by_date = {}
        for v in viirs_only:
            d = v.get("acq_date")
            viirs_only_by_date.setdefault(d, []).append(v)

        for d in dates:
            d_matched = matched_by_date.get(d, [])
            d_modis_only = modis_only_by_date.get(d, [])
            d_viirs_only = viirs_only_by_date.get(d, [])

            d_all_records = [r for r in grid_assigned_records if r.get("acq_date") == d]
            d_modis_records = [r for r in d_all_records if r.get("sensor") == "MODIS"]
            d_viirs_records = [r for r in d_all_records if r.get("sensor") == "VIIRS"]

            # Counts
            m_count = len(d_modis_records)
            v_count = len(d_viirs_records)
            matched_count = len(d_matched)
            modis_only_count = len(d_modis_only)
            viirs_only_count = len(d_viirs_only)

            # CRITICAL RULE: Effective independent burning detections
            # Neff = matched_count + modis_only_count + viirs_only_count
            effective_independent_detections = matched_count + modis_only_count + viirs_only_count

            # FRP summaries by sensor (strictly handle nulls, NaNs, and non-numeric inputs)
            def safe_frp(val: Any) -> float:
                if val is None:
                    return 0.0
                try:
                    num = float(val)
                    return num if (not math.isnan(num) and not math.isinf(num) and num >= 0.0) else 0.0
                except (ValueError, TypeError):
                    return 0.0

            m_frps = [safe_frp(r.get("frp_mw")) for r in d_modis_records]
            v_frps = [safe_frp(r.get("frp_mw")) for r in d_viirs_records]

            m_frp_sum = round(sum(m_frps), 2)
            m_frp_mean = round(float(np.mean(m_frps)), 2) if m_frps else 0.0
            m_frp_max = round(float(np.max(m_frps)), 2) if m_frps else 0.0

            v_frp_sum = round(sum(v_frps), 2)
            v_frp_mean = round(float(np.mean(v_frps)), 2) if v_frps else 0.0
            v_frp_max = round(float(np.max(v_frps)), 2) if v_frps else 0.0

            # Harmonized FRP calculation:
            # CRITICAL RULE: Prevent double-counting of coincident observations!
            # For matched groups, take joint geometric mean sqrt(FRP_MODIS * FRP_VIIRS).
            # For unmatched, take their individual sensor observations.
            matched_joint_frp = 0.0
            for g in d_matched:
                m_val = max(0.1, safe_frp(g.get("modis_frp_mw")))
                v_val = max(0.1, safe_frp(g.get("viirs_frp_mw")))
                matched_joint_frp += math.sqrt(m_val * v_val)

            modis_only_frp = sum(safe_frp(m.get("frp_mw")) for m in d_modis_only)
            viirs_only_frp = sum(safe_frp(v.get("frp_mw")) for v in d_viirs_only)
            harmonized_total_frp = round(matched_joint_frp + modis_only_frp + viirs_only_frp, 2)

            # Physical burned area estimation
            burned_area_est = self.calculate_burned_area_ha(harmonized_total_frp)

            # Data availability flag
            has_modis = m_count > 0
            has_viirs = v_count > 0
            if has_modis and has_viirs:
                data_availability = "DUAL_SENSOR_OVERPASS"
            elif has_viirs:
                data_availability = "VIIRS_ONLY_OVERPASS"
            elif has_modis:
                data_availability = "MODIS_ONLY_OVERPASS"
            else:
                data_availability = "NO_OBSERVATIONS"

            # Confidence category breakdown
            conf_categories = {"HIGH": 0, "NOMINAL": 0, "LOW": 0}
            for r in d_all_records:
                cat = r.get("confidence_category") or "NOMINAL"
                conf_categories[cat] = conf_categories.get(cat, 0) + 1

            # Grid cell breakdown for this day
            cells_occupied = set(r.get("cell_id") for r in d_all_records if r.get("cell_id"))

            daily_summaries.append({
                "date": d,
                "data_availability": data_availability,
                "observation_counts": {
                    "modis_detection_count": m_count,
                    "viirs_detection_count": v_count,
                    "uncalibrated_raw_sum_count_DO_NOT_USE_AS_FIRE_TOTAL": m_count + v_count,
                    "matched_observation_groups_count": matched_count,
                    "modis_only_count": modis_only_count,
                    "viirs_only_count": viirs_only_count,
                    "effective_independent_detections": effective_independent_detections,
                    "unique_grid_cells_active": len(cells_occupied),
                },
                "frp_summaries": {
                    "modis_frp_mw": {"sum": m_frp_sum, "mean": m_frp_mean, "max": m_frp_max},
                    "viirs_frp_mw": {"sum": v_frp_sum, "mean": v_frp_mean, "max": v_frp_max},
                    "harmonized_activity_frp_mw": harmonized_total_frp,
                },
                "estimated_burned_area": burned_area_est,
                "confidence_breakdown": conf_categories,
            })

        # Multi-day regional summary
        total_m_count = sum(d["observation_counts"]["modis_detection_count"] for d in daily_summaries)
        total_v_count = sum(d["observation_counts"]["viirs_detection_count"] for d in daily_summaries)
        total_effective = sum(d["observation_counts"]["effective_independent_detections"] for d in daily_summaries)
        total_harm_frp = round(sum(d["frp_summaries"]["harmonized_activity_frp_mw"] for d in daily_summaries), 2)
        total_burned_area = self.calculate_burned_area_ha(total_harm_frp)

        all_unique_cells = set(r.get("cell_id") for r in grid_assigned_records if r.get("cell_id"))

        # Cross-sensor consistency metric (0.0 to 1.0)
        consistency_index = round(
            min(total_m_count, total_v_count) / max(total_m_count, total_v_count)
            if max(total_m_count, total_v_count) > 0
            else 0.0,
            3,
        )

        return {
            "success": True,
            "region_name": region_name,
            "temporal_range": {
                "start_date": dates[0],
                "end_date": dates[-1],
                "total_days_analyzed": len(dates),
            },
            "regional_totals": {
                "total_modis_detections": total_m_count,
                "total_viirs_detections": total_v_count,
                "total_matched_groups": len(matched_groups),
                "total_modis_only_detections": len(modis_only),
                "total_viirs_only_detections": len(viirs_only),
                "effective_independent_detections_sum": total_effective,
                "total_unique_1km_cells_active": len(all_unique_cells),
                "harmonized_activity_frp_mw": total_harm_frp,
                "estimated_burned_area_ha": total_burned_area,
                "cross_sensor_consistency_index": consistency_index,
            },
            "daily_calendar": daily_summaries,
            "metadata_and_uncertainty": {
                "calibration_status": calibration_result.get("calibration_status") if calibration_result else "EXPERIMENTAL_UNCALIBRATED",
                "is_empirically_validated": calibration_result.get("is_validated") if calibration_result else False,
                "methodology_label": "FireSync Multi-Stage Equal-Area Harmonization Pipeline v1.0",
                "spatial_crs": "EPSG:8857 (Equal Earth WGS 84)",
                "grid_cell_resolution": "1000m x 1000m (100 Hectares)",
                "scientific_disclaimer": SCIENTIFIC_DISCLAIMER,
            },
        }

default_daily_aggregator = DailyHarmonizedAggregator()

