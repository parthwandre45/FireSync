"""
FireSync Scientific Harmonization Engine - Constants & Scientific Specifications
NASA Space Apps Challenge 2026
"""

# Default Coordinate Reference Systems (Equal-Area for valid surface area and distance calculations)
DEFAULT_GLOBAL_EQUAL_AREA_CRS = "EPSG:8857"   # Equal Earth projection (WGS 84 / Equal Earth)
DEFAULT_REGIONAL_EQUAL_AREA_CRS = "EPSG:102028" # Asia South Albers Equal Area Conic
WGS84_CRS = "EPSG:4326"                       # Unprojected geographic latitude/longitude

# Spatial grid defaults
DEFAULT_NOMINAL_GRID_RESOLUTION_M = 1000.0    # 1.0 km nominal grid cell
MIN_GRID_RESOLUTION_M = 250.0                 # High-resolution boundary
MAX_GRID_RESOLUTION_M = 10000.0               # 10 km regional coarse grid

# Temporal matching windows (in minutes)
DEFAULT_TEMPORAL_WINDOWS_MIN = [30, 60, 120]
DEFAULT_SPATIAL_MATCH_TOLERANCE_M = 1500.0    # 1.5 km spatial radius for coincident candidate search

# Satellite sensor nominal characteristics
SENSOR_SPECS = {
    "MODIS": {
        "instruments": ["MODIS"],
        "satellites": ["Terra", "Aqua"],
        "nominal_resolution_nadir_m": 1000.0,
        "nominal_footprint_km2": 1.0,
        "swath_width_km": 2330.0,
        "overpass_nominal_local_solar_time": {
            "Terra": {"Day": "10:30", "Night": "22:30"},
            "Aqua": {"Day": "13:30", "Night": "01:30"},
        },
        "detection_confidence_type": "PERCENTAGE_0_100",
        "thermal_channels": ["Channel 21/22 (4 um)", "Channel 31 (11 um)"],
        "frp_uncertainty_pct": 20.0,
    },
    "VIIRS": {
        "instruments": ["VIIRS"],
        "satellites": ["Suomi-NPP", "NOAA-20", "NOAA-21"],
        "nominal_resolution_nadir_m": 375.0,
        "nominal_footprint_km2": 0.1406,
        "swath_width_km": 3040.0,
        "overpass_nominal_local_solar_time": {
            "Suomi-NPP": {"Day": "13:30", "Night": "01:30"},
            "NOAA-20": {"Day": "13:20", "Night": "01:20"},
            "NOAA-21": {"Day": "13:40", "Night": "01:40"},
        },
        "detection_confidence_type": "CATEGORICAL_LOW_NOMINAL_HIGH",
        "thermal_channels": ["I-4 (3.74 um)", "I-5 (11.45 um)"],
        "frp_uncertainty_pct": 15.0,
    },
}

# Biomass Burning Wooster conversion coefficient for Fire Radiative Energy (FRE) to dry matter consumed
# C_b approx 0.368 kg/MJ (Wooster et al. 2005)
WOOSTER_BIOMASS_CONVERSION_KG_PER_MJ = 0.368
# Typical biomass consumption density factor for hectare burned estimation (tons/ha)
NOMINAL_FUEL_CONSUMPTION_TONS_PER_HA = 25.0

# Scientific Limitations & Warnings
SCIENTIFIC_DISCLAIMER = (
    "DISCLAIMER: Satellite active-fire observations reflect thermal anomalies detected at the time of "
    "satellite overpass and do not constitute confirmed or perimeter-delineated wildfires. "
    "MODIS and VIIRS possess fundamentally different pixel geometries (1 km vs 375 m) and detection "
    "thresholds. Hotspot detection counts must NEVER be added directly. Unmatched observations arise from "
    "orbital swath boundaries, temporal fire duration, cloud obscuration, or sub-pixel resolution differences, "
    "and must not be interpreted as false positives. Calibration models without ground-truth empirical "
    "cross-validation are labeled as experimental uncalibrated observed-activity indices."
)

