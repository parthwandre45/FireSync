/**
 * NASA Earthdata / GIBS (Global Imagery Browse Services) Integration
 * Provides real daily satellite imagery across multi-spectral bands
 * for any global wildfire coordinate.
 */

export type ImageryMode = 'natural' | 'false_color' | 'thermal' | 'before_after';

export interface SatelliteImageryConfig {
  id: string;
  label: string;
  mode: ImageryMode;
  sensor: 'VIIRS' | 'MODIS';
  layer: string;
  bands: string;
  resolution: string;
  wavelength: string;
  description: string;
  application: string;
}

export interface ImageryUrlOptions {
  lat: number;
  lon: number;
  date: string;
  layer: string;
  delta?: number; // bounding box half-width in degrees (~35-40 km span)
  width?: number;
  height?: number;
  format?: 'image/jpeg' | 'image/png';
}

/**
 * Builds an authentic NASA GIBS WMS (Web Map Service) GetMap URL.
 * Fully CORS-enabled, public, keyless OGC service provided by NASA ESDIS.
 */
export function buildGibsWmsUrl({
  lat,
  lon,
  date,
  layer,
  delta = 0.35,
  width = 800,
  height = 600,
  format = 'image/jpeg',
}: ImageryUrlOptions): string {
  // Clamp coordinates within valid geographic bounds
  const minLat = Math.max(-89.9, lat - delta);
  const maxLat = Math.min(89.9, lat + delta);
  const minLon = Math.max(-179.9, lon - delta);
  const maxLon = Math.min(179.9, lon + delta);

  // WMS 1.3.0 in EPSG:4326 uses Lat,Lon axis order
  const bbox = `${minLat.toFixed(4)},${minLon.toFixed(4)},${maxLat.toFixed(4)},${maxLon.toFixed(4)}`;

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: layer,
    STYLES: '',
    FORMAT: format,
    TRANSPARENT: 'false',
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
    CRS: 'EPSG:4326',
    BBOX: bbox,
    TIME: date,
  });

  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${params.toString()}`;
}

/**
 * Builds high-resolution surface reference fallback (Copernicus Sentinel-2 cloudless mosaic)
 */
export function buildHighResSurfaceUrl(lat: number, lon: number, delta = 0.25, width = 800, height = 600): string {
  const minLat = Math.max(-89.9, lat - delta);
  const maxLat = Math.min(89.9, lat + delta);
  const minLon = Math.max(-179.9, lon - delta);
  const maxLon = Math.min(179.9, lon + delta);
  const bbox = `${minLon.toFixed(4)},${minLat.toFixed(4)},${maxLon.toFixed(4)},${maxLat.toFixed(4)}`;

  return `https://tiles.maps.eox.at/wms?service=wms&request=getmap&version=1.1.1&layers=s2cloudless-2020&styles=&format=image/jpeg&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:4326`;
}

/**
 * Configuration for available multi-spectral imagery modes per sensor.
 */
export function getAvailableImageryConfigs(sensor: 'VIIRS' | 'MODIS'): SatelliteImageryConfig[] {
  if (sensor === 'VIIRS') {
    return [
      {
        id: 'viirs-natural',
        label: 'Natural Color (RGB)',
        mode: 'natural',
        sensor: 'VIIRS',
        layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        bands: 'I1 (0.64µm), M4 (0.55µm), M3 (0.48µm)',
        resolution: '375m at nadir',
        wavelength: '0.48 - 0.67 µm (Visible)',
        description: 'True-color natural spectrum corresponding to human vision. Highlights thick smoke plumes, convective pyrocumulus formations, and landscape topography.',
        application: 'Smoke plume trajectory, atmospheric dispersion, geographic context',
      },
      {
        id: 'viirs-swir',
        label: 'False Color (SWIR)',
        mode: 'false_color',
        sensor: 'VIIRS',
        layer: 'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1',
        bands: 'M11 (2.25µm), I2 (0.86µm), I1 (0.64µm)',
        resolution: '375m I-Band enhanced',
        wavelength: '0.64 - 2.25 µm (SWIR / NIR)',
        description: 'Short-Wave Infrared (SWIR) penetrates heavy smoke aerosols. Unburned forest canopy reflects vivid green; active flame fronts fluoresce bright neon orange/red; fresh char and burn scars appear deep crimson/maroon.',
        application: 'Smoke penetration, active combustion front mapping, burn perimeter delineation',
      },
      {
        id: 'viirs-thermal',
        label: 'Thermal Fire Mask',
        mode: 'thermal',
        sensor: 'VIIRS',
        layer: 'VIIRS_SNPP_Thermal_Anomalies_375m_All',
        bands: 'I4 (3.74µm thermal) & I5 (11.45µm)',
        resolution: '375m sub-pixel thermal sensitivity',
        wavelength: '3.74 - 11.45 µm (Mid-IR / Thermal IR)',
        description: 'Direct thermal radiance anomalies isolating sub-pixel combustion temperatures exceeding ambient background thresholds.',
        application: 'Sub-pixel ignition pinpointing, Fire Radiative Power (FRP) verification',
      },
      {
        id: 'viirs-compare',
        label: 'Before / After Fire',
        mode: 'before_after',
        sensor: 'VIIRS',
        layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        bands: 'Pre-fire baseline vs Peak burn',
        resolution: '375m comparative',
        wavelength: 'Visible / Near-IR temporal baseline',
        description: 'Side-by-side temporal split comparison between pre-fire vegetation baseline and active burn scar.',
        application: 'Burn severity assessment, ecosystem damage appraisal',
      },
    ];
  }

  // MODIS (Terra / Aqua)
  return [
    {
      id: 'modis-natural',
      label: 'Natural Color (RGB)',
      mode: 'natural',
      sensor: 'MODIS',
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      bands: 'Band 1 (0.65µm), Band 4 (0.55µm), Band 3 (0.47µm)',
      resolution: '250m / 500m optical',
      wavelength: '0.46 - 0.67 µm (Visible)',
      description: 'NASA MODIS 250m Corrected Reflectance TrueColor representation. Wide regional swath capturing continental smoke haze and cloud cover.',
      application: 'Regional smoke transport, synoptic meteorological context',
    },
    {
      id: 'modis-swir',
      label: 'False Color 7-2-1',
      mode: 'false_color',
      sensor: 'MODIS',
      layer: 'MODIS_Terra_CorrectedReflectance_Bands721',
      bands: 'Band 7 (2.13µm), Band 2 (0.86µm), Band 1 (0.65µm)',
      resolution: '250m / 500m multi-spectral',
      wavelength: '0.65 - 2.15 µm (SWIR / NIR)',
      description: 'Atmospheric penetration using short-wave infrared. Penetrates dense wildfire haze to reveal flaming fronts in bright golden-red and scorched terrain in deep mahogany.',
      application: 'Smoke-penetrating burn scar perimeter mapping',
    },
    {
      id: 'modis-thermal',
      label: 'Thermal Fire Mask',
      mode: 'thermal',
      sensor: 'MODIS',
      layer: 'MODIS_Terra_Thermal_Anomalies_All',
      bands: 'Band 21/22 (3.96µm) & Band 31 (11.0µm)',
      resolution: '1000m thermal anomaly resolution',
      wavelength: '3.96 - 11.0 µm (Thermal IR)',
      description: 'MOD14 / MYD14 high-temperature thermal anomaly detection mask developed by NASA GSFC.',
      application: 'Global thermal emission monitoring, carbon flux estimation',
    },
    {
      id: 'modis-compare',
      label: 'Before / After Fire',
      mode: 'before_after',
      sensor: 'MODIS',
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      bands: 'Temporal baseline comparison',
      resolution: '250m comparative',
      wavelength: 'Temporal multi-date baseline',
      description: 'Historical comparative review comparing pre-ignition forest density against post-ignition burn severity.',
      application: 'Multi-week burn severity tracking',
    },
  ];
}

/**
 * Calculates ground scale distance in kilometers for the bounding box half-width (delta in degrees).
 */
export function calculateGroundScaleKm(lat: number, delta: number): number {
  const latRad = (lat * Math.PI) / 180;
  // 1 degree latitude ~ 111 km; 1 degree longitude ~ 111 * cos(lat) km
  const kmPerDegLon = 111.32 * Math.cos(latRad);
  return Math.round(delta * 2 * kmPerDegLon);
}

