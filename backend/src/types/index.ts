import { UserRole, AccountStatus, FireStatus, IngestionStatus } from '@prisma/client';

export { UserRole, AccountStatus, FireStatus, IngestionStatus };

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface BoundingBoxQuery {
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
}

export interface FireQueryParams extends BoundingBoxQuery {
  confidence?: number;
  minFrp?: number;
  satellite?: string;
  sensor?: string;
  dayNight?: string;
  timeRange?: '24h' | '48h' | '7d' | '30d' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'frp' | 'confidence' | 'observationTime';
  sortOrder?: 'asc' | 'desc';
}

export interface EnrichedFireObservationDto {
  id: string;
  lat: number;
  lon: number;
  frp: number;
  confidence: number;
  brightnessTempK: number;
  brightnessTempC: number;
  satellite: string;
  sensor: string;
  sensorFamily: 'VIIRS' | 'MODIS';
  dayNight: string;
  scanResolution: string;
  observationTime: string;
  acquisitionDate: string;
  country: string;
  continent: string;
  region: string;
  incidentId: string | null;
  incidentName: string | null;
  biomassCombustionRateKgS: number;
  isNewDetection: boolean;
  hoursAgo: number;
}

export interface FireIncidentDto {
  id: string;
  name: string;
  centroidLat: number;
  centroidLon: number;
  firstObservedAt: string;
  lastObservedAt: string;
  status: FireStatus;
  observationCount: number;
  peakFrp: number;
  totalFrp: number;
  region: string | null;
  estimatedPerimeter: any | null;
}

export interface DashboardOverviewDto {
  activeDetections: number;
  newDetections: number;
  highConfidenceDetections: number;
  highConfidencePct: number;
  affectedCountriesCount: number;
  affectedContinentsCount: number;
  avgFrp: number;
  peakFrp: number;
  peakFrpHotspot: EnrichedFireObservationDto | null;
  latestObservation: EnrichedFireObservationDto | null;
  previousCycleDetections: number;
  trendPercentage: number;
  lastUpdatedUtc: string;
}

export interface DiurnalTrendPoint {
  hour: string;
  viirs: number;
  modis: number;
  total: number;
  avgFrp: number;
}

export interface RegionalActivityMetric {
  name: string;
  country: string;
  continent: string;
  count: number;
  avgFrp: number;
  maxFrp: number;
  riskLevel: 'Extreme' | 'Severe' | 'Elevated' | 'Moderate';
  trend: string;
  center: [number, number];
  primarySensor: string;
}

export interface SatelliteMissionDto {
  id: string;
  missionCode: string;
  name: string;
  satellitePlatform: string;
  sensor: string;
  description: string;
  orbitType: string;
  altitudeKm: number;
  inclinationDeg: number;
  spatialResolution: string;
  spectralBands: string;
  swathWidthKm: number | null;
  overpassTime: string | null;
  status: string;
  dataSource: string;
  latestPassUtc: string | null;
  detectionCount: number;
  operationalStatus: 'NOMINAL' | 'CALIBRATING' | 'STANDBY';
  dataLatency: string;
  coverageShare: number;
}

export interface WeatherDto {
  latitude: number;
  longitude: number;
  temperatureC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationMm: number;
  airQualityIndex: number | null;
  observationTime: string;
  dataSource: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    timestamp?: string;
  };
}

