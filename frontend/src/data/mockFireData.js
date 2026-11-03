/**
 * FireSync - Unified Satellite Fire Intelligence (NASA Space Apps Challenge 2026)
 * Real NASA FIRMS Satellite Feeds & Regional Specifications
 */

export const REGIONS = [
  {
    id: 'india_live',
    name: 'India (Live NASA FIRMS Feed)',
    country: 'India',
    center: [23.5937, 79.9629],
    zoom: 5,
    bounds: [[8.0, 68.0], [37.0, 97.5]],
    isLive: true,
    description: 'Active agricultural, forest & biomass burning across Punjab, Haryana, Madhya Pradesh & Central India directly ingested from NASA MODIS and VIIRS.',
  },
  {
    id: 'sierra_nevada',
    name: 'Sierra Nevada / Yosemite',
    country: 'United States',
    center: [37.7749, -119.5383],
    zoom: 11,
    bounds: [[37.5, -120.0], [38.1, -119.0]],
    isLive: false,
    description: 'Mixed conifer alpine forest, high-relief terrain, frequent summer dry-lightning ignitions.',
  },
  {
    id: 'amazon_basin',
    name: 'Southern Amazon Basin',
    country: 'Brazil',
    center: [-9.8713, -56.0889],
    zoom: 10,
    bounds: [[-10.5, -57.0], [-9.2, -55.2]],
    isLive: false,
    description: 'Tropical rainforest frontier, agricultural slash-and-burn expansion, heavy biomass smoke plumes.',
  },
  {
    id: 'mediterranean',
    name: 'Peloponnese & Attica',
    country: 'Greece',
    center: [37.9838, 22.3789],
    zoom: 10,
    bounds: [[37.2, 21.6], [38.5, 23.2]],
    isLive: false,
    description: 'Mediterranean scrubland and pine canopy, high Meltemi wind-driven crown fire spread.',
  },
  {
    id: 'southeast_australia',
    name: 'Blue Mountains & Hunter',
    country: 'Australia',
    center: [-33.7125, 150.3114],
    zoom: 10,
    bounds: [[-34.2, 149.6], [-33.1, 151.1]],
    isLive: false,
    description: 'Eucalyptus forest canopy with volatile oil content, extreme pyrocumulonimbus thunderstorm formation.',
  },
];

export const DATE_PRESETS = [
  { id: '24h', label: 'Last 24 Hours' },
  { id: '7d', label: 'Last 7 Days (Live NASA Feed)' },
  { id: 'season_2026', label: 'Peak Fire Season 2026' },
  { id: 'full_2026', label: 'Year-to-Date 2026' },
  { id: 'historical_5y', label: '5-Year Baseline (2021-2026)' },
];

export const DEMO_HOTSPOTS = {
  sierra_nevada: {
    modis: [
      { id: 'MOD-SN-01', lat: 37.7849, lon: -119.5483, brightness: 341.2, bright_t31: 299.4, frp: 52.4, satellite: 'Aqua', instrument: 'MODIS', confidence: 91, acq_date: '2026-08-15', acq_time: '13:30 UTC', scan: 1.2, track: 1.1, daynight: 'D' },
      { id: 'MOD-SN-02', lat: 37.7912, lon: -119.5320, brightness: 355.0, bright_t31: 304.1, frp: 78.6, satellite: 'Aqua', instrument: 'MODIS', confidence: 96, acq_date: '2026-08-15', acq_time: '13:30 UTC', scan: 1.2, track: 1.1, daynight: 'D' },
      { id: 'MOD-SN-03', lat: 37.7650, lon: -119.5190, brightness: 326.8, bright_t31: 294.0, frp: 34.2, satellite: 'Terra', instrument: 'MODIS', confidence: 79, acq_date: '2026-08-15', acq_time: '21:15 UTC', scan: 1.4, track: 1.2, daynight: 'N' },
      { id: 'MOD-SN-04', lat: 37.8105, lon: -119.5620, brightness: 338.4, bright_t31: 297.8, frp: 48.0, satellite: 'Aqua', instrument: 'MODIS', confidence: 87, acq_date: '2026-08-16', acq_time: '14:15 UTC', scan: 1.1, track: 1.0, daynight: 'D' },
      { id: 'MOD-SN-05', lat: 37.7510, lon: -119.4980, brightness: 322.1, bright_t31: 291.5, frp: 26.5, satellite: 'Terra', instrument: 'MODIS', confidence: 72, acq_date: '2026-08-16', acq_time: '10:45 UTC', scan: 1.3, track: 1.1, daynight: 'D' },
    ],
    viirs: [
      { id: 'VII-SN-01', lat: 37.7845, lon: -119.5478, brightness: 362.4, bright_ti5: 306.8, frp: 58.1, satellite: 'Suomi-NPP', instrument: 'VIIRS', confidence: 'high', acq_date: '2026-08-15', acq_time: '14:10 UTC', scan: 0.38, track: 0.37, daynight: 'D' },
      { id: 'VII-SN-02', lat: 37.7870, lon: -119.5445, brightness: 348.9, bright_ti5: 301.2, frp: 41.5, satellite: 'Suomi-NPP', instrument: 'VIIRS', confidence: 'nominal', acq_date: '2026-08-15', acq_time: '14:10 UTC', scan: 0.38, track: 0.37, daynight: 'D' },
      { id: 'VII-SN-03', lat: 37.7905, lon: -119.5315, brightness: 378.2, bright_ti5: 312.4, frp: 86.4, satellite: 'NOAA-20', instrument: 'VIIRS', confidence: 'high', acq_date: '2026-08-15', acq_time: '14:55 UTC', scan: 0.39, track: 0.38, daynight: 'D' },
      { id: 'VII-SN-04', lat: 37.7932, lon: -119.5280, brightness: 351.0, bright_ti5: 304.0, frp: 44.8, satellite: 'NOAA-20', instrument: 'VIIRS', confidence: 'high', acq_date: '2026-08-15', acq_time: '14:55 UTC', scan: 0.39, track: 0.38, daynight: 'D' },
      { id: 'VII-SN-05', lat: 37.7645, lon: -119.5185, brightness: 334.6, bright_ti5: 296.2, frp: 31.0, satellite: 'NOAA-21', instrument: 'VIIRS', confidence: 'nominal', acq_date: '2026-08-15', acq_time: '21:40 UTC', scan: 0.38, track: 0.37, daynight: 'N' },
      { id: 'VII-SN-06', lat: 37.7662, lon: -119.5210, brightness: 331.2, bright_ti5: 295.1, frp: 28.3, satellite: 'NOAA-21', instrument: 'VIIRS', confidence: 'nominal', acq_date: '2026-08-15', acq_time: '21:40 UTC', scan: 0.38, track: 0.37, daynight: 'N' },
      { id: 'VII-SN-07', lat: 37.8098, lon: -119.5612, brightness: 359.5, bright_ti5: 305.5, frp: 54.2, satellite: 'Suomi-NPP', instrument: 'VIIRS', confidence: 'high', acq_date: '2026-08-16', acq_time: '13:50 UTC', scan: 0.38, track: 0.37, daynight: 'D' },
      { id: 'VII-SN-08', lat: 37.8125, lon: -119.5645, brightness: 344.0, bright_ti5: 300.2, frp: 38.6, satellite: 'Suomi-NPP', instrument: 'VIIRS', confidence: 'nominal', acq_date: '2026-08-16', acq_time: '13:50 UTC', scan: 0.38, track: 0.37, daynight: 'D' },
      { id: 'VII-SN-09', lat: 37.7505, lon: -119.4972, brightness: 329.8, bright_ti5: 293.4, frp: 24.1, satellite: 'NOAA-20', instrument: 'VIIRS', confidence: 'low', acq_date: '2026-08-16', acq_time: '14:35 UTC', scan: 0.40, track: 0.39, daynight: 'D' },
    ],
    harmonized: [
      {
        cluster_id: 'CLUSTER-YOS-26A',
        name: 'Tuolumne Ridge Wildfire Complex',
        centroid: [37.7895, -119.5398],
        start_date: '2026-08-14',
        end_date: '2026-08-20',
        peak_date: '2026-08-15',
        total_frp: 364.5,
        estimated_burned_area_ha: 5740,
        modis_count: 5,
        viirs_count: 9,
        consistency_index: 0.942,
        growth_rate_ha_day: 820,
        status: 'Active Containing',
        polygon: [
          [37.780, -119.555],
          [37.798, -119.545],
          [37.795, -119.525],
          [37.760, -119.510],
          [37.750, -119.530],
          [37.780, -119.555],
        ]
      }
    ]
  },
  amazon_basin: {
    modis: [
      { id: 'MOD-AM-01', lat: -9.8510, lon: -56.1020, brightness: 348.6, bright_t31: 301.2, frp: 92.4, satellite: 'Aqua', instrument: 'MODIS', confidence: 95, acq_date: '2026-09-02', acq_time: '17:20 UTC', scan: 1.1, track: 1.0, daynight: 'D' },
    ],
    viirs: [
      { id: 'VII-AM-01', lat: -9.8505, lon: -56.1015, brightness: 372.4, bright_ti5: 309.1, frp: 104.2, satellite: 'Suomi-NPP', instrument: 'VIIRS', confidence: 'high', acq_date: '2026-09-02', acq_time: '17:45 UTC', scan: 0.38, track: 0.37, daynight: 'D' },
    ],
    harmonized: []
  },
  mediterranean: { modis: [], viirs: [], harmonized: [] },
  southeast_australia: { modis: [], viirs: [], harmonized: [] }
};

export const SENSOR_COMPARISON_SPECS = {
  modis: {
    sensorName: 'MODIS (Moderate Resolution Imaging Spectroradiometer)',
    satellites: 'Terra (EOS AM-1) & Aqua (EOS PM-1)',
    launchYears: '1999 (Terra) / 2002 (Aqua)',
    nominalResolution: '1,000 m (1 km at nadir, up to ~4.8 km at scan edge)',
    swathWidth: '2,330 km across-track',
    overpassTimes: 'Terra: 10:30 AM/PM local | Aqua: 01:30 AM/PM local',
    fireChannels: 'Channels 21 & 22 (3.9 μm), Channel 31 (11.0 μm)',
    saturationLimit: '~500 K (Channel 21)',
    temporalContinuity: '24+ consecutive years of global baseline archive',
    strengths: 'Gold-standard long-term climate record; low false-positive rate; robust saturated-fire handling',
    weaknesses: 'Footprint distortion at swath edge (bow-tie effect); misses sub-hectare low-intensity fires',
  },
  viirs: {
    sensorName: 'VIIRS (Visible Infrared Imaging Radiometer Suite)',
    satellites: 'Suomi-NPP, NOAA-20 (JPSS-1), NOAA-21 (JPSS-2)',
    launchYears: '2011 (S-NPP) / 2017 (NOAA-20) / 2022 (NOAA-21)',
    nominalResolution: '375 m (I-bands) with pixel size reduction across scan',
    swathWidth: '3,060 km (no gaps at equator)',
    overpassTimes: '01:30 AM/PM local (nominal constellation offset ~50 mins)',
    fireChannels: 'I4 (3.74 μm) & I5 (11.45 μm); M13 (4.05 μm)',
    saturationLimit: '~367 K (I4 dual-gain switches to M13)',
    temporalContinuity: 'Operational since 2012, continuing into 2030s',
    strengths: '375m spatial resolution; detects fires 3x smaller than MODIS; enhanced night-time smoldering detection',
    weaknesses: 'Shallow temporal baseline prior to 2012; higher pixel count creates perceived artificial burning surge without calibration',
  }
};

export const MULTI_YEAR_HISTORICAL = [
  { year: 2020, totalModisDetections: 42100, totalViirsDetections: 118400, harmonizedFRP_MW: 489200, burnedAreaHa: 7720000, consistencyScore: 0.912 },
  { year: 2021, totalModisDetections: 48500, totalViirsDetections: 139200, harmonizedFRP_MW: 564100, burnedAreaHa: 8910000, consistencyScore: 0.925 },
  { year: 2022, totalModisDetections: 39800, totalViirsDetections: 112600, harmonizedFRP_MW: 452000, burnedAreaHa: 7140000, consistencyScore: 0.931 },
  { year: 2023, totalModisDetections: 54200, totalViirsDetections: 158300, harmonizedFRP_MW: 641800, burnedAreaHa: 10140000, consistencyScore: 0.938 },
  { year: 2024, totalModisDetections: 46100, totalViirsDetections: 131900, harmonizedFRP_MW: 531200, burnedAreaHa: 8390000, consistencyScore: 0.944 },
  { year: 2025, totalModisDetections: 51800, totalViirsDetections: 149400, harmonizedFRP_MW: 602400, burnedAreaHa: 9510000, consistencyScore: 0.949 },
  { year: 2026, totalModisDetections: 49400, totalViirsDetections: 142100, harmonizedFRP_MW: 578600, burnedAreaHa: 9140000, consistencyScore: 0.952 },
];

export const MONTHLY_BURNING_PATTERN = [
  { month: 'Jan', modis: 1240, viirs: 3410, harmonized: 14200, share: '3.1%' },
  { month: 'Feb', modis: 1560, viirs: 4120, harmonized: 17800, share: '3.9%' },
  { month: 'Mar', modis: 2100, viirs: 5890, harmonized: 25100, share: '5.5%' },
  { month: 'Apr', modis: 2890, viirs: 8120, harmonized: 34200, share: '7.4%' },
  { month: 'May', modis: 3450, viirs: 9780, harmonized: 41600, share: '9.0%' },
  { month: 'Jun', modis: 5120, viirs: 14890, harmonized: 62400, share: '13.5%' },
  { month: 'Jul', modis: 8450, viirs: 24500, harmonized: 104200, share: '22.6%' },
  { month: 'Aug', modis: 9810, viirs: 28900, harmonized: 121500, share: '26.4%' },
  { month: 'Sep', modis: 6240, viirs: 18120, harmonized: 76400, share: '16.6%' },
  { month: 'Oct', modis: 3210, viirs: 9140, harmonized: 38900, share: '8.4%' },
  { month: 'Nov', modis: 1890, viirs: 5210, harmonized: 22400, share: '4.9%' },
  { month: 'Dec', modis: 1420, viirs: 3980, harmonized: 16800, share: '3.7%' },
];

export const BURNING_CALENDAR_DAILY = [
  { date: '2026-10-24', modisFrp: 2291.9, viirsFrp: 15223.1, totalFrp: 17514.9, burnedAreaHa: 27670, events: 12 },
  { date: '2026-10-25', modisFrp: 1232.2, viirsFrp: 13881.5, totalFrp: 15113.7, burnedAreaHa: 23880, events: 10 },
  { date: '2026-10-26', modisFrp: 4838.6, viirsFrp: 10282.9, totalFrp: 15121.5, burnedAreaHa: 23890, events: 14 },
  { date: '2026-10-27', modisFrp: 737.2, viirsFrp: 9026.7, totalFrp: 9763.8, burnedAreaHa: 15420, events: 8 },
  { date: '2026-10-28', modisFrp: 2084.8, viirsFrp: 13565.8, totalFrp: 15650.6, burnedAreaHa: 24730, events: 11 },
  { date: '2026-10-29', modisFrp: 5646.4, viirsFrp: 13122.0, totalFrp: 18768.4, burnedAreaHa: 29650, events: 16 }, // Peak
  { date: '2026-10-30', modisFrp: 739.6, viirsFrp: 14004.4, totalFrp: 14743.9, burnedAreaHa: 23290, events: 9 },
  { date: '2026-10-31', modisFrp: 1089.1, viirsFrp: 6680.4, totalFrp: 7769.5, burnedAreaHa: 12270, events: 6 },
];
