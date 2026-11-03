"""
FireSync Scientific Service - Comprehensive Pydantic Data Models & Schemas
NASA Space Apps Challenge 2026
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import date, datetime

class LibraryStatus(BaseModel):
    numpy: str
    pandas: str
    scipy: str
    shapely: str
    geopandas: str

class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "FireSync Python Scientific Processing Service"
    version: str = "2.0.0"
    timestamp: datetime
    uptime_seconds: float
    libraries: LibraryStatus
    database: Dict[str, Any]

# -------------------------------------------------------------
# Observation Schemas
# -------------------------------------------------------------
class RawObservationInput(BaseModel):
    id: Optional[str] = None
    sensor: Optional[str] = None
    satellite: Optional[str] = None
    instrument: Optional[str] = None
    latitude: Optional[float] = None
    lat: Optional[float] = None
    longitude: Optional[float] = None
    lon: Optional[float] = None
    acq_date: Optional[Union[str, date]] = None
    date: Optional[Union[str, date]] = None
    acq_time: Optional[Union[str, int]] = None
    time: Optional[Union[str, int]] = None
    acq_timestamp: Optional[Union[str, datetime]] = None
    brightness_kelvin: Optional[float] = None
    brightness: Optional[float] = None
    bright_ti4: Optional[float] = None
    bright_ti5: Optional[float] = None
    bright_t31: Optional[float] = None
    frp_mw: Optional[float] = None
    frp: Optional[float] = None
    confidence_raw: Optional[Union[str, int, float]] = None
    confidence: Optional[Union[str, int, float]] = None
    confidence_normalized: Optional[str] = None
    scan: Optional[float] = None
    track: Optional[float] = None
    daynight: Optional[str] = None
    country_code: Optional[str] = "IND"
    product: Optional[str] = None
    version: Optional[str] = None
    raw_metadata: Optional[Dict[str, Any]] = None

# -------------------------------------------------------------
# Pipeline Configuration & End-to-End Schemas
# -------------------------------------------------------------
class PipelineHarmonizeRequest(BaseModel):
    region_name: str = Field("India Regional Corridor", description="Target geographical region name")
    observations: Optional[List[Dict[str, Any]]] = Field(None, description="Direct list of raw observation dictionaries (if None, pulled from DB)")
    grid_resolution_m: float = Field(1000.0, description="Common spatial grid cell size in meters (nominal 1 km)")
    spatial_crs: str = Field("EPSG:8857", description="Equal-Area coordinate reference system (e.g. EPSG:8857 Equal Earth)")
    time_window_minutes: float = Field(60.0, description="Coincident temporal matching tolerance in minutes (30, 60, or 120)")
    spatial_match_distance_m: float = Field(1500.0, description="Coincident spatial match tolerance in projected meters")
    country_code: str = Field("IND", description="Country code to query from PostgreSQL if observations not passed")
    start_date: Optional[str] = Field(None, description="Start date filter YYYY-MM-DD")
    end_date: Optional[str] = Field(None, description="End date filter YYYY-MM-DD")
    persist_to_db: bool = Field(True, description="Whether to persist synthesized clusters to harmonized_fire_calendar")

class DbHarmonizeRequest(BaseModel):
    region_name: str = Field("India Indo-Gangetic & Central Plain", description="Region name")
    country_code: str = Field("IND", description="ISO country code in PostgreSQL normalized_fires")
    start_date: Optional[str] = Field(None, description="Beginning date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")
    grid_resolution_m: float = Field(1000.0, description="Equal-area grid cell dimension in meters")
    spatial_crs: str = Field("EPSG:8857", description="Equal-Area projection (EPSG:8857 Equal Earth)")
    time_window_minutes: float = Field(60.0, description="Temporal window in minutes (e.g. 30, 60, 90, 120)")
    spatial_match_distance_m: float = Field(1500.0, description="Spatial tolerance in meters (e.g. 1000, 1500, 2000)")
    limit: Optional[int] = Field(None, description="Maximum observations to retrieve (None for all)")
    persist_to_db: bool = Field(True, description="Persist results to harmonized_fire_calendar table")

# -------------------------------------------------------------
# Standalone Stage Schemas
# -------------------------------------------------------------
class Stage1Request(BaseModel):
    observations: List[Dict[str, Any]] = Field(..., description="Raw satellite observations")

class Stage2Request(BaseModel):
    standardized_records: List[Dict[str, Any]] = Field(..., description="Stage 1 standardized observations")
    spatial_crs: str = Field("EPSG:8857", description="Equal-Area projection")
    grid_resolution_m: float = Field(1000.0, description="Grid resolution in meters")

class Stage3Request(BaseModel):
    grid_assigned_records: List[Dict[str, Any]] = Field(..., description="Stage 2 grid-assigned observations")
    time_window_minutes: float = Field(60.0, description="Matching time tolerance in minutes (e.g. 30, 60, 120)")
    spatial_distance_threshold_m: float = Field(1500.0, description="Spatial tolerance in meters")

class Stage4Request(BaseModel):
    matched_groups: List[Dict[str, Any]] = Field(..., description="Coincident matched observation groups from Stage 3")
    test_split_ratio: float = Field(0.3, description="Proportion of data held out for validation")

class Stage5Request(BaseModel):
    grid_assigned_records: List[Dict[str, Any]]
    temporal_matching_result: Dict[str, Any]
    calibration_result: Optional[Dict[str, Any]] = None
    region_name: str = "India Regional Corridor"

# -------------------------------------------------------------
# Legacy Schemas for Backward Compatibility with Express Gateway
# -------------------------------------------------------------
class HarmonizeRequest(BaseModel):
    region_name: str = Field("India Indo-Gangetic Plain", description="Geographical bounding region or corridor")
    start_date: Optional[date] = Field(None, description="Beginning of observation window")
    end_date: Optional[date] = Field(None, description="End of observation window")
    spatial_threshold_km: float = Field(1.5, description="Clustering spatial radius threshold in km")
    temporal_threshold_days: int = Field(2, description="Temporal clustering window in days")

class HarmonizedClusterSummary(BaseModel):
    cluster_id: str
    region_name: str
    event_start_date: str
    event_end_date: str
    peak_burning_date: str
    modis_detections: int
    viirs_detections: int
    total_frp_mw: float
    estimated_burned_area_ha: float
    sensor_consistency_index: float
    centroid_lat: float
    centroid_lon: float

class HarmonizeResponse(BaseModel):
    success: bool
    region: str
    parameters: Dict[str, Any]
    clusters_found: int
    clusters: List[HarmonizedClusterSummary]
    message: str
