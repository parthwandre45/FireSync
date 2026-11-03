"""
Stage 1: Satellite Data Standardization & Validation Service
NASA Space Apps Challenge 2026 - FireSync
"""

import math
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

logger = logging.getLogger("firesync.standardizer")

def parse_utc_timestamp(acq_date: Any, acq_time: Any) -> Optional[datetime]:
    """
    Converts acquisition date and time into a timezone-aware UTC datetime.
    Supports YYYY-MM-DD + HHMM string/int, ISO8601 strings, or datetime instances.
    """
    if acq_date is None:
        return None

    # Case 1: Already datetime
    if isinstance(acq_date, datetime):
        if acq_date.tzinfo is None:
            return acq_date.replace(tzinfo=timezone.utc)
        return acq_date.astimezone(timezone.utc)

    # Case 2: ISO string in acq_date
    date_str = str(acq_date).strip()
    if "T" in date_str or (" " in date_str and ":" in date_str):
        try:
            # Handle ISO format
            clean_str = date_str.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except Exception:
            pass

    # Case 3: acq_date is YYYY-MM-DD, acq_time is HHMM (e.g. "1330", 1330, "045", 45)
    time_str = "0000"
    if acq_time is not None:
        raw_time = str(acq_time).strip().split(".")[0]
        # Pad with leading zeros to 4 digits (e.g. "45" -> "0045")
        time_str = raw_time.zfill(4)[:4]

    try:
        hours = int(time_str[:2])
        minutes = int(time_str[2:4])
        # Validate hours and minutes
        if hours > 23 or minutes > 59:
            hours = min(hours, 23)
            minutes = min(minutes, 59)

        # Parse date component
        date_parts = date_str.split("-")
        if len(date_parts) == 3:
            year, month, day = int(date_parts[0]), int(date_parts[1]), int(date_parts[2])
            return datetime(year, month, day, hours, minutes, 0, tzinfo=timezone.utc)
        
        # Fallback to date parsing
        dt = pd.to_datetime(f"{date_str} {hours:02d}:{minutes:02d}:00", utc=True)
        return dt.to_pydatetime()
    except Exception as e:
        logger.warning(f"Failed to parse timestamp '{acq_date}' '{acq_time}': {e}")
        return None

def normalize_satellite_name(sat: Any, sensor: str) -> str:
    """Normalizes satellite platform designation."""
    if not sat:
        return "Terra" if sensor.upper() == "MODIS" else "Suomi-NPP"
    s = str(sat).strip().upper()
    if s in ["T", "TERRA"]:
        return "Terra"
    if s in ["A", "AQUA"]:
        return "Aqua"
    if s in ["N", "NPP", "SNPP", "SUOMI-NPP"]:
        return "Suomi-NPP"
    if s in ["1", "J1", "NOAA-20", "JPSS-1"]:
        return "NOAA-20"
    if s in ["2", "J2", "NOAA-21", "JPSS-2"]:
        return "NOAA-21"
    return str(sat).strip()

def standardize_confidence(raw_conf: Any, sensor: str) -> Tuple[Optional[str], str, Optional[int], int]:
    """
    Standardizes sensor-specific confidence.
    Returns: (confidence_raw, confidence_category, confidence_percent, estimated_internal_score)
    
    IMPORTANT SCIENTIFIC RULE:
    NASA does NOT provide a percentage for VIIRS 375m (it is strictly categorical: low, nominal, high).
    Never invent a numeric NASA percentage for VIIRS! confidence_percent is strictly None for VIIRS.
    """
    s = sensor.upper()
    if raw_conf is None or pd.isna(raw_conf) or str(raw_conf).strip() == "":
        return (None, "NOMINAL", None, 50)

    raw_str = str(raw_conf).strip()

    if s == "MODIS":
        try:
            val = int(float(raw_str))
            val = max(0, min(100, val))
            if val < 30:
                cat = "LOW"
            elif val <= 80:
                cat = "NOMINAL"
            else:
                cat = "HIGH"
            # For MODIS: raw string, standard category, NASA percentage, internal score
            return (raw_str, cat, val, val)
        except Exception:
            return (raw_str, "NOMINAL", 50, 50)

    # VIIRS: NASA provides categorical confidence ('l', 'n', 'h', 'low', 'nominal', 'high')
    c_lower = raw_str.lower()
    if c_lower in ["h", "high"]:
        cat = "HIGH"
        internal_score = 95
    elif c_lower in ["l", "low"]:
        cat = "LOW"
        internal_score = 25
    else:
        cat = "NOMINAL"
        internal_score = 65

    # confidence_percent is strictly None for VIIRS to preserve NASA data integrity
    return (raw_str, cat, None, internal_score)

class DataStandardizer:
    """
    Stage 1 Service: Validates, cleanses, and standardizes satellite active-fire observations.
    """

    @staticmethod
    def standardize_records(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validates and standardizes a list of dictionary observations.
        Returns standardized records and a validation diagnostic report.
        """
        valid_records: List[Dict[str, Any]] = []
        rejected_records: List[Dict[str, Any]] = []
        diagnostics = {
            "total_input_records": len(records),
            "valid_records_count": 0,
            "rejected_records_count": 0,
            "rejection_reasons": {
                "missing_coordinates": 0,
                "out_of_bounds_coordinates": 0,
                "invalid_timestamp": 0,
                "invalid_frp": 0,
                "unknown_sensor": 0,
            },
            "sensor_counts": {"MODIS": 0, "VIIRS": 0},
            "temporal_range": {"min_utc": None, "max_utc": None},
        }

        min_time = None
        max_time = None

        for idx, r in enumerate(records):
            # 1. Determine sensor
            sensor = str(r.get("sensor") or r.get("instrument") or "").strip().upper()
            if "VIIRS" in sensor:
                sensor = "VIIRS"
            elif "MODIS" in sensor:
                sensor = "MODIS"
            else:
                # Infer from attributes if missing
                if "bright_ti4" in r or "bright_ti5" in r:
                    sensor = "VIIRS"
                elif "bright_t31" in r or "brightness" in r:
                    sensor = "MODIS"
                else:
                    diagnostics["rejection_reasons"]["unknown_sensor"] += 1
                    rejected_records.append({"index": idx, "reason": "unknown_sensor", "data": r})
                    continue

            # 2. Coordinate validation
            try:
                lat = float(r.get("latitude") if r.get("latitude") is not None else r.get("lat"))
                lon = float(r.get("longitude") if r.get("longitude") is not None else r.get("lon"))
            except (ValueError, TypeError):
                diagnostics["rejection_reasons"]["missing_coordinates"] += 1
                rejected_records.append({"index": idx, "reason": "missing_or_non_numeric_coordinates", "data": r})
                continue

            if math.isnan(lat) or math.isnan(lon):
                diagnostics["rejection_reasons"]["missing_coordinates"] += 1
                rejected_records.append({"index": idx, "reason": "nan_coordinates", "data": r})
                continue

            if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                diagnostics["rejection_reasons"]["out_of_bounds_coordinates"] += 1
                rejected_records.append({"index": idx, "reason": "out_of_bounds_coordinates", "data": r})
                continue

            # 3. Timestamp parsing
            acq_date = r.get("acq_date") or r.get("date") or r.get("acq_timestamp")
            acq_time = r.get("acq_time") or r.get("time")
            utc_timestamp = parse_utc_timestamp(acq_date, acq_time)
            if utc_timestamp is None:
                diagnostics["rejection_reasons"]["invalid_timestamp"] += 1
                rejected_records.append({"index": idx, "reason": "invalid_timestamp", "data": r})
                continue

            # Track min/max times
            if min_time is None or utc_timestamp < min_time:
                min_time = utc_timestamp
            if max_time is None or utc_timestamp > max_time:
                max_time = utc_timestamp

            # 4. Thermal and FRP metrics
            # Brightness temperature (Kelvin)
            raw_bright = (
                r.get("brightness_kelvin")
                or r.get("bright_ti4")
                or r.get("brightness")
                or r.get("bright_t31")
            )
            try:
                brightness_k = float(raw_bright) if raw_bright is not None else 300.0
                if brightness_k < 150.0 or brightness_k > 600.0:  # Physical Kelvin plausible limits for Earth fire detection
                    brightness_k = max(150.0, min(600.0, brightness_k))
            except (ValueError, TypeError):
                brightness_k = 300.0

            # Fire Radiative Power (MW)
            raw_frp = r.get("frp_mw") if r.get("frp_mw") is not None else r.get("frp")
            try:
                frp = float(raw_frp) if raw_frp is not None and not pd.isna(raw_frp) else 0.0
                if frp < 0.0:
                    frp = 0.0
            except (ValueError, TypeError):
                frp = 0.0

            # 5. Scan and Track pixel dimensions (km)
            try:
                scan = float(r.get("scan") or (1.0 if sensor == "MODIS" else 0.375))
                track = float(r.get("track") or (1.0 if sensor == "MODIS" else 0.375))
            except (ValueError, TypeError):
                scan = 1.0 if sensor == "MODIS" else 0.375
                track = 1.0 if sensor == "MODIS" else 0.375

            # Compute pixel ground footprint (km^2)
            pixel_footprint_km2 = float(r.get("pixel_footprint_km2") or (scan * track))

            # 6. Satellite and Platform metadata
            satellite = normalize_satellite_name(r.get("satellite"), sensor)
            instrument = str(r.get("instrument") or sensor)
            daynight = str(r.get("daynight") or "D").strip().upper()[:1]
            if daynight not in ["D", "N"]:
                daynight = "D"

            # 7. Confidence handling (preserve original NASA formats)
            raw_conf = r.get("confidence_raw") if r.get("confidence_raw") is not None else r.get("confidence")
            conf_raw, conf_cat, conf_pct, internal_score = standardize_confidence(raw_conf, sensor)

            # 8. Record identification & lineage
            record_id = str(r.get("id") or f"{sensor}_{satellite}_{lat:.4f}_{lon:.4f}_{utc_timestamp.strftime('%Y%m%d%H%M')}")
            product = str(r.get("product") or ("MODIS_C6_1" if sensor == "MODIS" else "VIIRS_C2"))
            version = str(r.get("version") or ("6.1NRT" if sensor == "MODIS" else "2.0NRT"))

            standardized_row = {
                "observation_id": record_id,
                "sensor": sensor,
                "satellite": satellite,
                "instrument": instrument,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "acq_timestamp_utc": utc_timestamp.isoformat(),
                "acq_date": utc_timestamp.strftime("%Y-%m-%d"),
                "acq_time": utc_timestamp.strftime("%H%M"),
                "brightness_kelvin": round(brightness_k, 2),
                "frp_mw": round(frp, 2),
                "scan_km": round(scan, 2),
                "track_km": round(track, 2),
                "pixel_footprint_km2": round(pixel_footprint_km2, 4),
                "confidence_raw": conf_raw,
                "confidence_category": conf_cat,
                "confidence_percent": conf_pct,               # real NASA numeric percent (MODIS only, None for VIIRS)
                "estimated_internal_score": internal_score,   # explicitly labeled internal algorithmic score
                "daynight": daynight,
                "country_code": str(r.get("country_code") or "IND"),
                "product": product,
                "version": version,
                "raw_metadata": r.get("raw_metadata") or r,
            }

            valid_records.append(standardized_row)
            diagnostics["sensor_counts"][sensor] += 1

        diagnostics["valid_records_count"] = len(valid_records)
        diagnostics["rejected_records_count"] = len(rejected_records)
        if min_time:
            diagnostics["temporal_range"]["min_utc"] = min_time.isoformat()
        if max_time:
            diagnostics["temporal_range"]["max_utc"] = max_time.isoformat()

        return {
            "success": True,
            "data": valid_records,
            "diagnostics": diagnostics,
            "rejected_records": rejected_records[:50],  # sample up to 50 for inspection
        }

    @staticmethod
    def to_dataframe(standardized_records: List[Dict[str, Any]]) -> pd.DataFrame:
        """Converts standardized records to a strongly-typed pandas DataFrame."""
        if not standardized_records:
            return pd.DataFrame()
        df = pd.DataFrame(standardized_records)
        df["acq_datetime"] = pd.to_datetime(df["acq_timestamp_utc"], utc=True)
        return df

standardizer = DataStandardizer()

