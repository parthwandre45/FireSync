"""
Tests for Stage 4: Sensor-Aware Calibration & Cross-Sensor Synthesis Service
"""

import pytest
import numpy as np
from app.services.calibrator import SensorCalibrator, default_calibrator


class TestSensorCalibrator:
    def test_compute_distribution_metrics(self):
        calibrator = SensorCalibrator()
        frp_values = [10.5, 20.0, 15.2, 55.4, 120.0, 18.3, 22.1]
        metrics = calibrator.compute_distribution_metrics(frp_values)

        assert metrics["count"] == 7
        assert metrics["min_mw"] == 10.5
        assert metrics["max_mw"] == 120.0
        assert metrics["median_mw"] == 20.0
        assert metrics["mean_mw"] > 0
        assert "p25_mw" in metrics
        assert "p75_mw" in metrics
        assert "p90_mw" in metrics
        assert "skewness" in metrics

    def test_empty_distribution_metrics(self):
        calibrator = SensorCalibrator()
        metrics = calibrator.compute_distribution_metrics([])
        assert metrics["count"] == 0

    def test_insufficient_samples_flagged_as_experimental(self):
        """
        CRITICAL SCIENTIFIC INTEGRITY RULE:
        Do not claim validated calibration without actual validation.
        If calibration is not validated, clearly label the result as experimental/uncalibrated.
        """
        calibrator = SensorCalibrator(min_samples_for_calibration=10)
        # Provide only 4 matched pairs (< 10)
        sparse_matched = [
            {"modis_frp_mw": 30.0, "viirs_frp_mw": 25.0, "acq_date": "2026-10-28"},
            {"modis_frp_mw": 40.0, "viirs_frp_mw": 35.0, "acq_date": "2026-10-28"},
            {"modis_frp_mw": 20.0, "viirs_frp_mw": 18.0, "acq_date": "2026-10-29"},
            {"modis_frp_mw": 50.0, "viirs_frp_mw": 42.0, "acq_date": "2026-10-29"},
        ]

        result = calibrator.train_and_validate_calibration(sparse_matched)
        assert result["calibration_status"] == "EXPERIMENTAL_UNCALIBRATED"
        assert result["is_validated"] is False
        assert "Insufficient coincident matched pairs" in result["message"]

    def test_theil_sen_calibration_with_sufficient_samples(self):
        calibrator = SensorCalibrator(min_samples_for_calibration=10)
        # Synthesize 15 realistic coincident pairs across 3 dates
        matched = []
        for i in range(15):
            date = f"2026-10-2{8 + (i % 3)}"
            m_frp = float(20.0 + i * 5.0)
            # VIIRS FRP correlated with MODIS FRP plus slight noise
            v_frp = float(m_frp * 0.85 + (i % 2) * 1.5)
            matched.append({
                "modis_frp_mw": m_frp,
                "viirs_frp_mw": v_frp,
                "acq_date": date,
            })

        result = calibrator.train_and_validate_calibration(matched)
        assert "robust_theil_sen_model" in result
        model = result["robust_theil_sen_model"]
        assert "slope" in model
        assert "intercept" in model
        assert isinstance(model["slope"], float)
        assert isinstance(model["intercept"], float)

        assert "quantile_mapping" in result
        qm = result["quantile_mapping"]
        assert len(qm["quantiles"]) == 5
        assert len(qm["modis_quantiles_mw"]) == 5
        assert len(qm["viirs_quantiles_mw"]) == 5

        assert "validation_metrics" in result
        metrics = result["validation_metrics"]
        assert "mean_absolute_error_mw" in metrics
        assert "root_mean_square_error_mw" in metrics
        assert "pearson_correlation_r" in metrics

    def test_harmonize_observation_activity_coincident(self):
        calibrator = SensorCalibrator()
        obs = {"observation_id": "M1", "sensor": "MODIS", "frp_mw": 40.0}
        match_group = {"modis_frp_mw": 40.0, "viirs_frp_mw": 30.0}

        harmonized = calibrator.harmonize_observation_activity(obs, match_group, None)
        assert harmonized["status"] == "COINCIDENT_MATCHED"
        assert harmonized["confidence_level"] == "HIGH_CONFIDENCE_COINCIDENT"
        # Geometric mean: sqrt(40 * 30) = sqrt(1200) ~= 34.64
        assert pytest.approx(harmonized["harmonized_activity_frp_mw"], abs=0.1) == 34.64

    def test_harmonize_observation_activity_unmatched_uncalibrated(self):
        calibrator = SensorCalibrator()
        obs = {"observation_id": "V1", "sensor": "VIIRS", "frp_mw": 15.0}

        harmonized = calibrator.harmonize_observation_activity(obs, None, None)
        assert harmonized["status"] == "VIIRS_ONLY"
        assert harmonized["confidence_level"] == "EXPERIMENTAL_UNCALIBRATED_OBSERVED"
        assert harmonized["harmonized_activity_frp_mw"] == 15.0

