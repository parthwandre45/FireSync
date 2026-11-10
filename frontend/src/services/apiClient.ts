import { GLOBAL_HOTSPOTS, HotspotPoint } from '../components/earth/fireData';

const API_BASE = '/api/v1';

export interface ApiObservation {
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

export interface ApiOverviewMetrics {
  activeDetections: number;
  newDetections: number;
  highConfidenceDetections: number;
  highConfidencePct: number;
  affectedCountriesCount: number;
  affectedContinentsCount: number;
  avgFrp: number;
  peakFrp: number;
  peakFrpHotspot: ApiObservation | null;
  latestObservation: ApiObservation | null;
  previousCycleDetections: number;
  trendPercentage: number;
  lastUpdatedUtc: string;
}

export interface ApiSatelliteMission {
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

export interface ApiFireIncident {
  id: string;
  name: string;
  centroidLat: number;
  centroidLon: number;
  firstObservedAt: string;
  lastObservedAt: string;
  status: string;
  observationCount: number;
  peakFrp: number;
  totalFrp: number;
  region: string | null;
}

export interface ApiWeather {
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

export interface UserAuthData {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  token: string;
}

class ApiClient {
  private token: string | null = null;
  private backendLive = true;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('firesync_token') : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('firesync_token', token);
      else localStorage.removeItem('firesync_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public isLive(): boolean {
    return this.backendLive;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      this.backendLive = true;
      return json.data;
    } catch (err) {
      this.backendLive = false;
      throw err;
    }
  }

  // Dashboard Overview
  public async getDashboardOverview(): Promise<ApiOverviewMetrics> {
    try {
      return await this.request<ApiOverviewMetrics>('/dashboard/overview');
    } catch {
      // Offline fallback
      return {
        activeDetections: GLOBAL_HOTSPOTS.length,
        newDetections: Math.round(GLOBAL_HOTSPOTS.length * 0.8),
        highConfidenceDetections: GLOBAL_HOTSPOTS.length,
        highConfidencePct: 100,
        affectedCountriesCount: 14,
        affectedContinentsCount: 6,
        avgFrp: Math.round(GLOBAL_HOTSPOTS.reduce((s, h) => s + h.frp, 0) / GLOBAL_HOTSPOTS.length),
        peakFrp: Math.max(...GLOBAL_HOTSPOTS.map((h) => h.frp)),
        peakFrpHotspot: null,
        latestObservation: null,
        previousCycleDetections: Math.round(GLOBAL_HOTSPOTS.length * 0.94),
        trendPercentage: 6.2,
        lastUpdatedUtc: new Date().toISOString()
      };
    }
  }

  // Fires
  public async getFires(params?: {
    limit?: number;
    minLat?: number;
    maxLat?: number;
    minLon?: number;
    maxLon?: number;
    confidence?: number;
    minFrp?: number;
  }): Promise<ApiObservation[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.minLat !== undefined) qs.set('minLat', String(params.minLat));
      if (params?.maxLat !== undefined) qs.set('maxLat', String(params.maxLat));
      if (params?.minLon !== undefined) qs.set('minLon', String(params.minLon));
      if (params?.maxLon !== undefined) qs.set('maxLon', String(params.maxLon));
      if (params?.confidence !== undefined) qs.set('confidence', String(params.confidence));
      if (params?.minFrp !== undefined) qs.set('minFrp', String(params.minFrp));

      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      return await this.request<ApiObservation[]>(`/fires${queryStr}`);
    } catch {
      // Fallback to local GLOBAL_HOTSPOTS
      return GLOBAL_HOTSPOTS.map((h) => ({
        id: h.id,
        lat: h.lat,
        lon: h.lon,
        frp: h.frp,
        confidence: h.confidence,
        brightnessTempK: Math.round(335 + (h.frp / 440) * 55),
        brightnessTempC: Math.round(335 + (h.frp / 440) * 55 - 273.15),
        satellite: h.satellite,
        sensor: h.satellite.includes('VIIRS') ? 'VIIRS' : 'MODIS',
        sensorFamily: h.satellite.includes('VIIRS') ? 'VIIRS' : 'MODIS',
        dayNight: 'Day (Ascending)',
        scanResolution: h.satellite.includes('VIIRS') ? '375m I-Band' : '1000m Multi-spectral',
        observationTime: new Date().toISOString(),
        acquisitionDate: new Date().toISOString(),
        country: h.region.split(' ')[0] || 'Global',
        continent: 'Global',
        region: h.region,
        incidentId: null,
        incidentName: null,
        biomassCombustionRateKgS: Number((h.frp * 0.082).toFixed(1)),
        isNewDetection: true,
        hoursAgo: 1
      }));
    }
  }

  // Incidents
  public async getIncidents(): Promise<ApiFireIncident[]> {
    try {
      return await this.request<ApiFireIncident[]>('/incidents');
    } catch {
      return [];
    }
  }

  // Satellites
  public async getSatellites(): Promise<ApiSatelliteMission[]> {
    try {
      return await this.request<ApiSatelliteMission[]>('/satellites');
    } catch {
      return [];
    }
  }

  // Weather Nearby
  public async getWeatherNearby(lat: number, lon: number): Promise<ApiWeather> {
    try {
      return await this.request<ApiWeather>(`/weather/nearby?lat=${lat}&lon=${lon}`);
    } catch {
      return {
        latitude: lat,
        longitude: lon,
        temperatureC: 32.5,
        humidityPct: 24,
        windSpeedKmh: 25.2,
        windDirectionDeg: 210,
        precipitationMm: 0,
        airQualityIndex: 155,
        observationTime: new Date().toISOString(),
        dataSource: 'Local Fallback'
      };
    }
  }

  // System Health
  public async getHealth() {
    return this.request<{ status: string; database: { connected: boolean } }>('/system/health');
  }

  // Auth Login
  public async login(email: string, password: string): Promise<UserAuthData> {
    const data = await this.request<UserAuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  // Current User
  public async getMe() {
    return this.request<any>('/auth/me');
  }
}

export const apiClient = new ApiClient();

