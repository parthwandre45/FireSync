"""
Stage 4: Sensor-Aware Calibration & Cross-Sensor Synthesis Service
NASA Space Apps Challenge 2026 - FireSync
"""

import math
import logging
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

logger = logging.getLogger("firesync.calibrator")

class SensorCalibrator:
    """
    Stage 4 Service: Analyzes empirical FRP distributions and coincident detections across MODIS and VIIRS.
    Applies statistically defensible calibration models with held-out validation.
    Enforces scientific integrity: never invents universal multipliers, never discards unmatched observations.
    """

    def __init__(self, min_samples_for_calibration: int = 10):
        self.min_samples_for_calibration = min_samples_for_calibration

    @staticmethod
    def compute_distribution_metrics(frp_series: List[float]) -> Dict[str, Any]:
        """Calculates robust statistical summary of Fire Radiative Power (MW)."""
        if not frp_series:
            return {
                "count": 0,
                "mean_mw": 0.0,
                "median_mw": 0.0,
                "std_mw": 0.0,
                "min_mw": 0.0,
                "max_mw": 0.0,
                "p25_mw": 0.0,
                "p75_mw": 0.0,
                "p90_mw": 0.0,
                "skewness": 0.0,
            }

        arr = np.array(frp_series, dtype=float)
        arr = arr[~np.isnan(arr)]
        if len(arr) == 0:
            return {"count": 0}

        return {
            "count": int(len(arr)),
            "sum_mw": round(float(np.sum(arr)), 2),
            "mean_mw": round(float(np.mean(arr)), 2),
            "median_mw": round(float(np.median(arr)), 2),
            "std_mw": round(float(np.std(arr)), 2),
            "min_mw": round(float(np.min(arr)), 2),
            "max_mw": round(float(np.max(arr)), 2),
            "p25_mw": round(float(np.percentile(arr, 25)), 2),
            "p75_mw": round(float(np.percentile(arr, 75)), 2),
            "p90_mw": round(float(np.percentile(arr, 90)), 2),
            "skewness": round(float(stats.skew(arr)), 3) if len(arr) > 2 else 0.0,
        }

    def train_and_validate_calibration(
        self, matched_groups: List[Dict[str, Any]], test_split_ratio: float = 0.3
    ) -> Dict[str, Any]:
        """
        Calibrates MODIS and VIIRS FRP using coincident matched pairs with train/test cross-validation.
        
        CRITICAL SCIENTIFIC RULES:
        1. A single universal multiplier does NOT exist because the ratio varies by fire regime,
           sub-pixel vegetation cover, and atmospheric water vapor.
        2. Unmatched observations must NEVER be discarded.
        3. If sample size is insufficient, the result is explicitly flagged as uncalibrated.
        """
        valid_pairs = []
        for g in matched_groups:
            m_frp = float(g.get("modis_frp_mw") or 0.0)
            v_frp = float(g.get("viirs_frp_mw") or 0.0)
            date_str = str(g.get("acq_date") or "2026-01-01")
            if m_frp > 0.0 and v_frp > 0.0:
                valid_pairs.append({
                    "modis_frp": m_frp,
                    "viirs_frp": v_frp,
                    "date": date_str,
                    "ratio": v_frp / m_frp,
                })

        # Insufficient data check
        if len(valid_pairs) < self.min_samples_for_calibration:
            return {
                "calibration_status": "EXPERIMENTAL_UNCALIBRATED",
                "is_validated": False,
                "message": (
                    f"Insufficient coincident matched pairs ({len(valid_pairs)} < {self.min_samples_for_calibration}). "
                    "Output is strictly labeled as an experimental uncalibrated observed-activity index."
                ),
                "model_parameters": None,
                "validation_metrics": None,
            }

        df_pairs = pd.DataFrame(valid_pairs)

        # Temporal split (held-out dates for validation)
        unique_dates = df_pairs["date"].unique()
        if len(unique_dates) >= 3:
            # Sort dates and split by later dates
            sorted_dates = sorted(unique_dates)
            split_idx = max(1, int(len(sorted_dates) * (1.0 - test_split_ratio)))
            train_dates = set(sorted_dates[:split_idx])
            test_dates = set(sorted_dates[split_idx:])
            train_mask = df_pairs["date"].isin(train_dates)
            test_mask = df_pairs["date"].isin(test_dates)
            split_type = "TEMPORAL_HELD_OUT_DATES"
        else:
            # Random shuffle split if few dates
            np.random.seed(42)
            perm = np.random.permutation(len(df_pairs))
            split_pt = max(1, int(len(df_pairs) * (1.0 - test_split_ratio)))
            train_mask = pd.Series(False, index=df_pairs.index)
            train_mask.iloc[perm[:split_pt]] = True
            test_mask = ~train_mask
            split_type = "RANDOM_CROSS_VALIDATION"

        train_data = df_pairs[train_mask]
        test_data = df_pairs[test_mask]

        if len(train_data) < 3 or len(test_data) < 2:
            train_data = df_pairs
            test_data = df_pairs
            split_type = "FULL_DATASET_SELF_CHECK"

        # Fit Model 1: Robust Theil-Sen Median Slope (Log-transformed to handle extreme skewed FRP)
        # log(VIIRS) = slope * log(MODIS) + intercept
        log_m_train = np.log10(np.maximum(train_data["modis_frp"], 0.1))
        log_v_train = np.log10(np.maximum(train_data["viirs_frp"], 0.1))

        theil_sen_res = stats.theilslopes(log_v_train, log_m_train)
        slope = float(theil_sen_res.slope)
        intercept = float(theil_sen_res.intercept)

        # Fit Model 2: Quantile Mapping (ECDF matching points at 10th, 25th, 50th, 75th, 90th percentiles)
        quantiles = [0.10, 0.25, 0.50, 0.75, 0.90]
        q_modis = [float(np.percentile(train_data["modis_frp"], q * 100)) for q in quantiles]
        q_viirs = [float(np.percentile(train_data["viirs_frp"], q * 100)) for q in quantiles]

        # Validation on test partition
        log_m_test = np.log10(np.maximum(test_data["modis_frp"], 0.1))
        v_actual = test_data["viirs_frp"].values
        v_pred = np.power(10.0, slope * log_m_test + intercept)

        residuals = v_pred - v_actual
        mae = float(np.mean(np.abs(residuals)))
        rmse = float(np.sqrt(np.mean(residuals ** 2)))
        mean_bias = float(np.mean(residuals))
        
        # Correlations
        if len(v_actual) > 2 and np.std(v_actual) > 0 and np.std(v_pred) > 0:
            pearson_r, _ = stats.pearsonr(v_actual, v_pred)
            spearman_rho, _ = stats.spearmanr(v_actual, v_pred)
        else:
            pearson_r, spearman_rho = 0.0, 0.0

        is_validated = bool(len(test_data) >= 5 and pearson_r > 0.4)

        return {
            "calibration_status": "EMPIRICALLY_VALIDATED" if is_validated else "EXPERIMENTAL_UNCALIBRATED",
            "is_validated": is_validated,
            "split_methodology": split_type,
            "training_samples_count": len(train_data),
            "validation_samples_count": len(test_data),
            "robust_theil_sen_model": {
                "formula": "log10(VIIRS_FRP) = slope * log10(MODIS_FRP) + intercept",
                "slope": round(slope, 4),
                "intercept": round(intercept, 4),
            },
            "quantile_mapping": {
                "quantiles": quantiles,
                "modis_quantiles_mw": [round(q, 2) for q in q_modis],
                "viirs_quantiles_mw": [round(q, 2) for q in q_viirs],
            },
            "validation_metrics": {
                "mean_absolute_error_mw": round(mae, 2),
                "root_mean_square_error_mw": round(rmse, 2),
                "mean_bias_error_mw": round(mean_bias, 2),
                "pearson_correlation_r": round(float(pearson_r), 3),
                "spearman_rank_correlation_rho": round(float(spearman_rho), 3),
            },
            "scientific_guardrail": (
                "Notice: This cross-calibration is computed strictly from coincident observations and is only valid "
                "within the bounding region and temporal domain sampled. It is intended for trend harmonization, "
                "NOT for synthesising unobserved individual satellite passes. All unmatched observations are strictly preserved."
            ),
        }

    def harmonize_observation_activity(
        self,
        observation: Dict[str, Any],
        matched_group: Optional[Dict[str, Any]],
        calibration_model: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Calculates the harmonized activity index for an individual detection,
        transparently documenting whether it is coincident-matched, sensor-only, or calibrated.
        """
        sensor = observation["sensor"]
        raw_frp = float(observation.get("frp_mw") or 0.0)

        if matched_group:
            # Coincident detection: We have both MODIS and VIIRS measurements of the anomaly.
            # Robust joint estimate: use sensor geometry inverse-variance weighted FRP or geometric mean
            m_frp = float(matched_group["modis_frp_mw"])
            v_frp = float(matched_group["viirs_frp_mw"])
            
            # Geometric mean prevents bias from extreme single-sensor outliers
            harmonized_frp = math.sqrt(max(0.1, m_frp) * max(0.1, v_frp))
            confidence_level = "HIGH_CONFIDENCE_COINCIDENT"
            status = "COINCIDENT_MATCHED"
        else:
            status = f"{sensor}_ONLY"
            if sensor == "MODIS":
                # For MODIS-only detections, adjust via calibration model if validated, else retain raw with disclaimer
                if calibration_model and calibration_model.get("is_validated"):
                    slope = calibration_model["robust_theil_sen_model"]["slope"]
                    intercept = calibration_model["robust_theil_sen_model"]["intercept"]
                    log_v = slope * math.log10(max(0.1, raw_frp)) + intercept
                    harmonized_frp = math.pow(10.0, log_v)
                    confidence_level = "CALIBRATED_ESTIMATE"
                else:
                    harmonized_frp = raw_frp
                    confidence_level = "EXPERIMENTAL_UNCALIBRATED_OBSERVED"
            else:
                # VIIRS-only detection: High spatial resolution (375m), sensitive to small/cooler fire
                harmonized_frp = raw_frp
                confidence_level = "EXPERIMENTAL_UNCALIBRATED_OBSERVED"

        return {
            "observation_id": observation["observation_id"],
            "sensor": sensor,
            "status": status,
            "raw_frp_mw": raw_frp,
            "harmonized_activity_frp_mw": round(harmonized_frp, 2),
            "confidence_level": confidence_level,
        }

default_calibrator = SensorCalibrator()
