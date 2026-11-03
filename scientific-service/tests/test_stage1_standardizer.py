"""
Tests for Stage 1: Satellite Data Standardization & Validation Service
"""

import pytest
from datetime import datetime, timezone
from app.services.standardizer import (
    parse_utc_timestamp,
    normalize_satellite_name,
    standardize_confidence,
    DataStandardizer,
    standardizer,
)


class TestTimestampParsing:
    def test_parse_iso_string(self):
        dt = parse_utc_timestamp("2026-10-28T14:30:00Z", None)
        assert dt == datetime(2026, 10, 28, 14, 30, 0, tzinfo=timezone.utc)

    def test_parse_date_and_hhmm_string(self):
        dt = parse_utc_timestamp("2026-10-28", "0845")
        assert dt == datetime(2026, 10, 28, 8, 45, 0, tzinfo=timezone.utc)

    def test_parse_date_and_short_integer_time(self):
        # 45 should become 0045 (00:45)
        dt = parse_utc_timestamp("2026-10-28", 45)
        assert dt == datetime(2026, 10, 28, 0, 45, 0, tzinfo=timezone.utc)

    def test_parse_invalid_date_returns_none(self):
        assert parse_utc_timestamp("invalid-date", "1200") is None
        assert parse_utc_timestamp(None, None) is None


class TestSatelliteNormalization:
    def test_modis_satellites(self):
        assert normalize_satellite_name("T", "MODIS") == "Terra"
        assert normalize_satellite_name("TERRA", "MODIS") == "Terra"
        assert normalize_satellite_name("A", "MODIS") == "Aqua"
        assert normalize_satellite_name("AQUA", "MODIS") == "Aqua"

    def test_viirs_satellites(self):
        assert normalize_satellite_name("N", "VIIRS") == "Suomi-NPP"
        assert normalize_satellite_name("SNPP", "VIIRS") == "Suomi-NPP"
        assert normalize_satellite_name("1", "VIIRS") == "NOAA-20"
        assert normalize_satellite_name("2", "VIIRS") == "NOAA-21"


class TestConfidencePreservation:
    """
    CRITICAL NASA SCIENTIFIC INTEGRITY RULE:
    NASA does NOT provide numeric percentage confidence for VIIRS 375m active fire data.
    VIIRS confidence is strictly categorical ('low', 'nominal', 'high').
    confidence_percent MUST be None for VIIRS.
    """

    def test_modis_numeric_confidence(self):
        raw, cat, pct, score = standardize_confidence("85", "MODIS")
        assert raw == "85"
        assert cat == "HIGH"
        assert pct == 85
        assert score == 85

        raw, cat, pct, score = standardize_confidence("50", "MODIS")
        assert cat == "NOMINAL"
        assert pct == 50

        raw, cat, pct, score = standardize_confidence("15", "MODIS")
        assert cat == "LOW"
        assert pct == 15

    def test_viirs_categorical_confidence_preserves_none_percent(self):
        # High confidence
        raw, cat, pct, score = standardize_confidence("h", "VIIRS")
        assert raw == "h"
        assert cat == "HIGH"
        assert pct is None  # CRITICAL: Must be None, never a fake percentage
        assert score == 95  # Internal algorithmic score clearly labeled

        # Nominal confidence
        raw, cat, pct, score = standardize_confidence("nominal", "VIIRS")
        assert cat == "NOMINAL"
        assert pct is None
        assert score == 65

        # Low confidence
        raw, cat, pct, score = standardize_confidence("l", "VIIRS")
        assert cat == "LOW"
        assert pct is None
        assert score == 25


class TestDataStandardizerPipeline:
    def test_valid_records_standardization(self):
        raw_data = [
            {
                "latitude": 30.5,
                "longitude": 75.8,
                "acq_date": "2026-10-28",
                "acq_time": "0830",
                "brightness": 335.5,
                "frp": 42.1,
                "sensor": "MODIS",
                "satellite": "Terra",
                "confidence": "80",
                "scan": 1.2,
                "track": 1.1,
            },
            {
                "lat": 30.51,
                "lon": 75.81,
                "acq_date": "2026-10-28",
                "acq_time": "0835",
                "bright_ti4": 348.0,
                "frp": 15.6,
                "sensor": "VIIRS",
                "satellite": "N",
                "confidence": "h",
            },
        ]

        result = standardizer.standardize_records(raw_data)
        assert result["success"] is True
        assert result["diagnostics"]["valid_records_count"] == 2
        assert result["diagnostics"]["rejected_records_count"] == 0
        assert result["diagnostics"]["sensor_counts"]["MODIS"] == 1
        assert result["diagnostics"]["sensor_counts"]["VIIRS"] == 1

        modis_rec = result["data"][0]
        assert modis_rec["sensor"] == "MODIS"
        assert modis_rec["confidence_category"] == "NOMINAL"
        assert modis_rec["confidence_percent"] == 80
        assert modis_rec["frp_mw"] == 42.1

        viirs_rec = result["data"][1]
        assert viirs_rec["sensor"] == "VIIRS"
        assert viirs_rec["satellite"] == "Suomi-NPP"
        assert viirs_rec["confidence_category"] == "HIGH"
        assert viirs_rec["confidence_percent"] is None
        assert viirs_rec["estimated_internal_score"] == 95

    def test_rejection_of_invalid_coordinates(self):
        invalid_data = [
            {"latitude": 95.0, "longitude": 75.0, "acq_date": "2026-10-28", "sensor": "MODIS"},  # lat > 90
            {"latitude": "nan", "longitude": 75.0, "acq_date": "2026-10-28", "sensor": "MODIS"}, # NaN
            {"longitude": 75.0, "acq_date": "2026-10-28", "sensor": "MODIS"},                      # missing lat
        ]
        result = standardizer.standardize_records(invalid_data)
        assert result["diagnostics"]["valid_records_count"] == 0
        assert result["diagnostics"]["rejected_records_count"] == 3

    def test_frp_and_brightness_clamping(self):
        records = [
            {
                "latitude": 28.5,
                "longitude": 77.2,
                "acq_date": "2026-10-28",
                "acq_time": "1200",
                "sensor": "MODIS",
                "frp": -5.0,            # Negative FRP should clamp to 0.0
                "brightness": 1200.0,   # Implausible Kelvin should clamp to 600.0
            }
        ]
        result = standardizer.standardize_records(records)
        assert result["data"][0]["frp_mw"] == 0.0
        assert result["data"][0]["brightness_kelvin"] == 600.0

