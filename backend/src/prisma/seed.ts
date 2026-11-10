import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { logger } from '../config/logger';
import { UserRole, AccountStatus, FireStatus } from '@prisma/client';
import { FirmsIngestionService, haversineDistanceKm } from '../services/firmsIngestionService';

// Raw realistic hotspots from fireData.ts
const SEED_HOTSPOTS = [
  // South America
  { id: 'sa-amz-01', lat: -11.85, lon: -55.50, frp: 420, conf: 99, region: 'Mato Grosso Amazon Basin (Alta Floresta)', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-amz-02', lat: -12.55, lon: -55.72, frp: 390, conf: 98, region: 'Mato Grosso Deforestation Arc (Sorriso)', sat: 'MODIS (Aqua)' },
  { id: 'sa-amz-03', lat: -13.50, lon: -52.25, frp: 360, conf: 97, region: 'Araguaia River Savanna Corridor', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-amz-04', lat: -12.10, lon: -54.80, frp: 380, conf: 98, region: 'Xingu Indigenous Park Perimeter', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-amz-05', lat: -14.20, lon: -56.50, frp: 320, conf: 96, region: 'Mato Grosso Southern Agricultural Frontier', sat: 'MODIS (Terra)' },
  { id: 'sa-amz-06', lat: -15.60, lon: -56.10, frp: 305, conf: 95, region: 'Pantanal Northern Savanna Basin', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-ron-01', lat: -8.76, lon: -63.90, frp: 410, conf: 99, region: 'Rondônia Jamari Forest Reserve Frontier', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-ron-02', lat: -10.88, lon: -61.95, frp: 375, conf: 98, region: 'Central Rondônia Rainforest Edge', sat: 'MODIS (Aqua)' },
  { id: 'sa-ron-03', lat: -12.74, lon: -60.13, frp: 310, conf: 95, region: 'Vilhena Southern Amazon Plateau', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-acr-01', lat: -9.97, lon: -67.81, frp: 330, conf: 96, region: 'Acre Western Rainforest Boundary', sat: 'MODIS (Terra)' },
  { id: 'sa-par-01', lat: -6.64, lon: -51.98, frp: 440, conf: 99, region: 'São Félix do Xingu Megafire Complex', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-par-02', lat: -7.15, lon: -55.42, frp: 385, conf: 98, region: 'Novo Progresso BR-163 Logging Arc', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-par-03', lat: -5.20, lon: -53.20, frp: 345, conf: 97, region: 'Altamira Xingu River Basin', sat: 'MODIS (Aqua)' },
  { id: 'sa-amz-07', lat: -7.20, lon: -59.88, frp: 360, conf: 97, region: 'Apuí Trans-Amazonian Frontier', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-amz-08', lat: -7.26, lon: -64.80, frp: 325, conf: 96, region: 'Lábrea Purus River Rainforest', sat: 'MODIS (Terra)' },
  { id: 'sa-cer-01', lat: -14.13, lon: -47.51, frp: 300, conf: 95, region: 'Goiás Chapada dos Veadeiros Plateau', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-cer-02', lat: -10.50, lon: -46.75, frp: 285, conf: 94, region: 'Tocantins Jalapão Dry Savanna', sat: 'MODIS (Aqua)' },
  { id: 'sa-cer-03', lat: -6.37, lon: -44.36, frp: 270, conf: 93, region: 'Maranhão Mirador Cerrado Savanna', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-bol-01', lat: -16.50, lon: -61.50, frp: 415, conf: 99, region: 'Santa Cruz Chiquitania Dry Forest', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-bol-02', lat: -16.37, lon: -60.95, frp: 370, conf: 98, region: 'San Ignacio de Velasco Wilderness', sat: 'MODIS (Aqua)' },
  { id: 'sa-bol-03', lat: -14.83, lon: -64.90, frp: 340, conf: 96, region: 'Beni Savanna Llanos de Moxos', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-bol-04', lat: -17.75, lon: -59.75, frp: 315, conf: 95, region: 'Roboré Chiquitano Forest Front', sat: 'MODIS (Terra)' },
  { id: 'sa-par-04', lat: -22.35, lon: -60.05, frp: 335, conf: 96, region: 'Paraguayan Gran Chaco Scrubland', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-par-05', lat: -20.50, lon: -59.50, frp: 295, conf: 94, region: 'Alto Paraguay Chaco Basin', sat: 'MODIS (Aqua)' },
  { id: 'sa-arg-01', lat: -24.78, lon: -63.80, frp: 350, conf: 97, region: 'Salta Chaco Dry Forest', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-arg-02', lat: -24.30, lon: -60.50, frp: 280, conf: 94, region: 'Formosa Bermejo Basin', sat: 'MODIS (Terra)' },
  { id: 'sa-arg-03', lat: -27.80, lon: -64.25, frp: 275, conf: 93, region: 'Santiago del Estero Scrub', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-arg-04', lat: -32.88, lon: -68.84, frp: 310, conf: 95, region: 'Mendoza Andean Precordillera', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-arg-05', lat: -38.95, lon: -70.05, frp: 265, conf: 93, region: 'Neuquén Patagonian Steppe', sat: 'MODIS (Aqua)' },
  { id: 'sa-arg-06', lat: -41.13, lon: -71.30, frp: 255, conf: 92, region: 'Bariloche Andean Foothills', sat: 'VIIRS (S-NPP)' },
  { id: 'sa-chi-01', lat: -35.43, lon: -71.65, frp: 290, conf: 94, region: 'Maule Central Valley (Chile)', sat: 'VIIRS (NOAA-20)' },
  { id: 'sa-chi-02', lat: -37.47, lon: -72.35, frp: 285, conf: 93, region: 'Biobío Andean Pine Foothills', sat: 'MODIS (Terra)' },

  // North America
  { id: 'na-cal-01', lat: 39.80, lon: -120.90, frp: 410, conf: 99, region: 'Northern Sierra Nevada (Plumas)', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-cal-02', lat: 40.85, lon: -122.80, frp: 385, conf: 98, region: 'Shasta-Trinity Mountain Complex', sat: 'MODIS (Aqua)' },
  { id: 'na-cal-03', lat: 37.15, lon: -119.30, frp: 350, conf: 97, region: 'Sierra National Forest (Fresno)', sat: 'VIIRS (S-NPP)' },
  { id: 'na-cal-04', lat: 34.30, lon: -118.05, frp: 320, conf: 95, region: 'San Gabriel Mountain Chaparral', sat: 'MODIS (Terra)' },
  { id: 'na-pnw-01', lat: 44.05, lon: -121.30, frp: 375, conf: 98, region: 'Oregon Central Cascades (Deschutes)', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-pnw-02', lat: 42.45, lon: -123.10, frp: 345, conf: 96, region: 'Siskiyou Mountain Conifers (Rogue River)', sat: 'MODIS (Aqua)' },
  { id: 'na-pnw-03', lat: 44.30, lon: -118.95, frp: 295, conf: 94, region: 'Oregon Blue Mountains (Malheur)', sat: 'VIIRS (S-NPP)' },
  { id: 'na-pnw-04', lat: 48.40, lon: -120.10, frp: 360, conf: 97, region: 'Washington North Cascades (Okanogan)', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-pnw-05', lat: 46.60, lon: -120.80, frp: 285, conf: 93, region: 'Yakima Cascade Mountain Foothills', sat: 'MODIS (Terra)' },
  { id: 'na-roc-01', lat: 45.20, lon: -114.90, frp: 430, conf: 99, region: 'Salmon River Wilderness (Frank Church)', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-roc-02', lat: 43.90, lon: -115.50, frp: 355, conf: 97, region: 'Boise National Forest Sawtooth Range', sat: 'MODIS (Aqua)' },
  { id: 'na-roc-03', lat: 46.10, lon: -115.80, frp: 330, conf: 96, region: 'Clearwater National Forest Complex', sat: 'VIIRS (S-NPP)' },
  { id: 'na-roc-04', lat: 47.60, lon: -113.80, frp: 380, conf: 98, region: 'Flathead National Forest Swan Range', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-roc-05', lat: 46.85, lon: -114.20, frp: 320, conf: 95, region: 'Bitterroot Mountains (Lolo)', sat: 'MODIS (Terra)' },
  { id: 'na-roc-06', lat: 43.60, lon: -109.80, frp: 295, conf: 94, region: 'Wyoming Wind River Range', sat: 'VIIRS (S-NPP)' },
  { id: 'na-roc-07', lat: 44.50, lon: -109.50, frp: 275, conf: 93, region: 'Shoshone National Forest (Absaroka)', sat: 'MODIS (Aqua)' },
  { id: 'na-roc-08', lat: 39.60, lon: -107.10, frp: 305, conf: 95, region: 'Colorado White River Plateau', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-sw-01', lat: 34.45, lon: -111.20, frp: 330, conf: 96, region: 'Arizona Mogollon Rim (Coconino)', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-sw-02', lat: 33.90, lon: -109.30, frp: 310, conf: 95, region: 'White Mountains Pine Forest', sat: 'MODIS (Aqua)' },
  { id: 'na-sw-03', lat: 33.15, lon: -108.20, frp: 315, conf: 95, region: 'New Mexico Gila Wilderness Complex', sat: 'VIIRS (S-NPP)' },
  { id: 'na-sw-04', lat: 35.80, lon: -105.75, frp: 285, conf: 94, region: 'Sangre de Cristo Mountains (Santa Fe)', sat: 'MODIS (Terra)' },
  { id: 'na-sw-05', lat: 30.50, lon: -99.50, frp: 260, conf: 92, region: 'Texas Edwards Plateau Scrub', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-can-01', lat: 53.50, lon: -117.20, frp: 395, conf: 99, region: 'Alberta Foothills Jasper Perimeter', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-can-02', lat: 56.70, lon: -111.35, frp: 370, conf: 98, region: 'Fort McMurray Boreal Forest', sat: 'MODIS (Aqua)' },
  { id: 'na-can-03', lat: 56.20, lon: -117.30, frp: 335, conf: 96, region: 'Peace River Boreal Wilderness', sat: 'VIIRS (S-NPP)' },
  { id: 'na-can-04', lat: 50.70, lon: -120.30, frp: 350, conf: 97, region: 'BC Okanagan Kamloops Interior', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-can-05', lat: 52.15, lon: -122.15, frp: 320, conf: 95, region: 'BC Cariboo Williams Lake Conifers', sat: 'MODIS (Terra)' },
  { id: 'na-mex-01', lat: 28.50, lon: -107.50, frp: 340, conf: 96, region: 'Chihuahua Sierra Madre Occidental', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-mex-02', lat: 24.50, lon: -105.30, frp: 310, conf: 95, region: 'Durango Sierra Conifer Forests', sat: 'MODIS (Aqua)' },
  { id: 'na-mex-03', lat: 16.50, lon: -91.20, frp: 325, conf: 96, region: 'Chiapas Lacandon Jungle Complex', sat: 'VIIRS (S-NPP)' },
  { id: 'na-gua-01', lat: 17.20, lon: -90.10, frp: 345, conf: 97, region: 'Guatemala Maya Biosphere Reserve', sat: 'VIIRS (NOAA-20)' },
  { id: 'na-se-01', lat: 30.30, lon: -82.40, frp: 280, conf: 94, region: 'Florida Osceola National Forest', sat: 'MODIS (Terra)' },
  { id: 'na-se-02', lat: 33.20, lon: -83.50, frp: 255, conf: 92, region: 'Georgia Oconee Pine Woodlands', sat: 'VIIRS (S-NPP)' },

  // Africa
  { id: 'af-con-01', lat: -4.50, lon: 21.80, frp: 360, conf: 98, region: 'Central DR Congo Savanna', sat: 'VIIRS (NOAA-20)' },
  { id: 'af-ang-01', lat: -11.50, lon: 18.20, frp: 320, conf: 96, region: 'Central Angola Bié Plateau', sat: 'VIIRS (S-NPP)' },
  { id: 'af-zam-01', lat: -13.80, lon: 27.40, frp: 335, conf: 97, region: 'Zambia Central Miombo Woodlands', sat: 'MODIS (Aqua)' },
  { id: 'af-kat-01', lat: -8.90, lon: 25.50, frp: 295, conf: 95, region: 'Katanga Savanna Basin', sat: 'VIIRS (NOAA-20)' },
  { id: 'af-moz-01', lat: -15.20, lon: 35.50, frp: 285, conf: 94, region: 'Northern Mozambique Savanna', sat: 'MODIS (Terra)' },
  { id: 'af-mad-01', lat: -18.80, lon: 46.50, frp: 270, conf: 93, region: 'Madagascar Central Grasslands', sat: 'VIIRS (S-NPP)' },

  // Australia
  { id: 'au-nt-01', lat: -16.50, lon: 133.20, frp: 350, conf: 97, region: 'Northern Territory Arnhem Savanna', sat: 'VIIRS (NOAA-20)' },
  { id: 'au-qld-01', lat: -22.50, lon: 143.20, frp: 300, conf: 95, region: 'Central Queensland Grasslands', sat: 'MODIS (Aqua)' },
  { id: 'au-wa-01', lat: -19.40, lon: 128.80, frp: 275, conf: 93, region: 'Tanami Desert Inland Savanna', sat: 'VIIRS (S-NPP)' },
  { id: 'au-kim-01', lat: -17.20, lon: 125.50, frp: 325, conf: 96, region: 'Kimberley Inland Plateau', sat: 'VIIRS (NOAA-20)' },

  // Asia
  { id: 'in-mp-01', lat: 23.20, lon: 78.50, frp: 330, conf: 97, region: 'Central India (Madhya Pradesh)', sat: 'VIIRS (NOAA-20)' },
  { id: 'in-pun-01', lat: 30.80, lon: 75.85, frp: 370, conf: 99, region: 'Punjab Indo-Gangetic Plains', sat: 'MODIS (Terra)' },
  { id: 'in-mah-01', lat: 21.15, lon: 79.10, frp: 280, conf: 94, region: 'Vidarbha Dry Deciduous Forest', sat: 'VIIRS (S-NPP)' },
  { id: 'sea-mya-01', lat: 21.20, lon: 95.80, frp: 315, conf: 96, region: 'Central Myanmar Dry Zone', sat: 'VIIRS (NOAA-20)' },
  { id: 'sea-lao-01', lat: 19.80, lon: 101.50, frp: 295, conf: 95, region: 'Northern Laos Mountain Highlands', sat: 'VIIRS (S-NPP)' },
  { id: 'sea-tha-01', lat: 18.50, lon: 99.20, frp: 280, conf: 94, region: 'Northern Thailand Chiang Mai Highlands', sat: 'MODIS (Aqua)' },

  // Siberian Boreal & European Mediterranean
  { id: 'sib-sak-01', lat: 62.03, lon: 129.74, frp: 360, conf: 97, region: 'Sakha Republic (Yakutia) Larch Taiga', sat: 'VIIRS (NOAA-20)' },
  { id: 'sib-kra-01', lat: 58.00, lon: 93.00, frp: 310, conf: 95, region: 'Krasnoyarsk Central Siberian Plateau', sat: 'VIIRS (S-NPP)' },
  { id: 'eu-gre-01', lat: 38.20, lon: 22.80, frp: 330, conf: 96, region: 'Central Greece Pine Forest', sat: 'VIIRS (NOAA-20)' },
  { id: 'eu-spa-01', lat: 40.20, lon: -6.20, frp: 300, conf: 95, region: 'Extremadura Oak Woodlands', sat: 'MODIS (Aqua)' },
  { id: 'eu-por-01', lat: 40.10, lon: -7.50, frp: 290, conf: 94, region: 'Serra da Estrela Mountain Conifers', sat: 'MODIS (Terra)' }
];

async function seed() {
  logger.info('Starting FireSync database seeding...');

  // 1. Users
  const adminPasswordHash = await bcrypt.hash('FiresyncAdmin2026!', 10);
  const analystPasswordHash = await bcrypt.hash('FiresyncAnalyst2026!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@firesync.nasa.gov' },
    update: { passwordHash: adminPasswordHash, role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
    create: {
      email: 'admin@firesync.nasa.gov',
      fullName: 'NASA Operations Administrator',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE
    }
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'user@firesync.nasa.gov' },
    update: { passwordHash: analystPasswordHash, role: UserRole.REGISTERED, status: AccountStatus.ACTIVE },
    create: {
      email: 'user@firesync.nasa.gov',
      fullName: 'Wildfire Intelligence Analyst',
      passwordHash: analystPasswordHash,
      role: UserRole.REGISTERED,
      status: AccountStatus.ACTIVE
    }
  });

  logger.info(`Seeded Users: ${admin.email}, ${analyst.email}`);

  // 2. Satellite Missions
  const missions = [
    {
      missionCode: 'MODIS_TERRA',
      name: 'Terra (EOS AM-1)',
      satellitePlatform: 'Terra',
      sensor: 'MODIS',
      description: 'NASA Earth Observing System flagship in sun-synchronous morning orbit (10:30 AM descending). Provides 36-band moderate-resolution imaging for global fire radiative power and aerosol optical depth.',
      orbitType: 'Sun-synchronous polar',
      altitudeKm: 705.0,
      inclinationDeg: 98.2,
      spatialResolution: '250m - 1km',
      spectralBands: '36 bands (0.405 - 14.385 µm)',
      swathWidthKm: 2330.0,
      overpassTime: '10:30 Descending',
      status: 'OPERATIONAL // NOMINAL TELEMETRY',
      dataSource: 'NASA EOSDIS / GSFC'
    },
    {
      missionCode: 'MODIS_AQUA',
      name: 'Aqua (EOS PM-1)',
      satellitePlatform: 'Aqua',
      sensor: 'MODIS',
      description: 'NASA Earth Observing System satellite in afternoon orbit (1:30 PM ascending). Captures peak afternoon diurnal fire radiative power and thermal anomalies globally.',
      orbitType: 'Sun-synchronous polar',
      altitudeKm: 705.0,
      inclinationDeg: 98.2,
      spatialResolution: '250m - 1km',
      spectralBands: '36 bands (0.405 - 14.385 µm)',
      swathWidthKm: 2330.0,
      overpassTime: '13:30 Ascending',
      status: 'OPERATIONAL // NOMINAL TELEMETRY',
      dataSource: 'NASA EOSDIS / GSFC'
    },
    {
      missionCode: 'VIIRS_SNPP',
      name: 'Suomi-NPP (SNPP)',
      satellitePlatform: 'Suomi-NPP',
      sensor: 'VIIRS',
      description: 'Joint NASA/NOAA mission providing 375m I-band active fire detection. Pierces smoke plumes and detects smaller cooler fires with lower false-alarm rates.',
      orbitType: 'Sun-synchronous polar',
      altitudeKm: 824.0,
      inclinationDeg: 98.7,
      spatialResolution: '375m I-band / 750m M-band',
      spectralBands: '22 imaging & radiometric bands',
      swathWidthKm: 3040.0,
      overpassTime: '13:30 Ascending',
      status: 'OPERATIONAL // HIGH-RESOLUTION STREAM',
      dataSource: 'NASA FIRMS / NOAA JPSS'
    },
    {
      missionCode: 'VIIRS_NOAA20',
      name: 'NOAA-20 (JPSS-1)',
      satellitePlatform: 'NOAA-20',
      sensor: 'VIIRS',
      description: 'First JPSS operational satellite flying in tandem with Suomi-NPP with a 50-minute offset, providing unprecedented global revisit rates and low-latency thermal anomaly detection.',
      orbitType: 'Sun-synchronous polar',
      altitudeKm: 824.0,
      inclinationDeg: 98.7,
      spatialResolution: '375m I-band / 750m M-band',
      spectralBands: '22 imaging & radiometric bands',
      swathWidthKm: 3040.0,
      overpassTime: '12:40 Ascending',
      status: 'OPERATIONAL // LOW LATENCY FEED',
      dataSource: 'NASA FIRMS / NOAA JPSS'
    }
  ];

  for (const m of missions) {
    await prisma.satelliteMission.upsert({
      where: { missionCode: m.missionCode },
      update: m,
      create: m
    });
  }
  logger.info('Seeded 4 Satellite Missions.');

  // 3. Satellite Imagery Layers
  const layers = [
    {
      layerId: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
      title: 'VIIRS Suomi-NPP Corrected Reflectance (True Color)',
      sensor: 'VIIRS',
      dataset: 'NASA_GIBS',
      acquisitionDate: new Date(),
      imageryType: 'TRUE_COLOR',
      resolution: '250m',
      wmtsTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
      attribution: 'NASA EOSDIS GIBS / Suomi-NPP VIIRS'
    },
    {
      layerId: 'MODIS_Terra_CorrectedReflectance_TrueColor',
      title: 'MODIS Terra Corrected Reflectance (True Color)',
      sensor: 'MODIS',
      dataset: 'NASA_GIBS',
      acquisitionDate: new Date(),
      imageryType: 'TRUE_COLOR',
      resolution: '250m',
      wmtsTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
      attribution: 'NASA EOSDIS GIBS / Terra MODIS'
    },
    {
      layerId: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
      title: 'MODIS Aqua Corrected Reflectance (True Color)',
      sensor: 'MODIS',
      dataset: 'NASA_GIBS',
      acquisitionDate: new Date(),
      imageryType: 'TRUE_COLOR',
      resolution: '250m',
      wmtsTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
      attribution: 'NASA EOSDIS GIBS / Aqua MODIS'
    },
    {
      layerId: 'VIIRS_NOAA20_Thermal_Anomalies_375m_All',
      title: 'VIIRS NOAA-20 Thermal Anomalies / Active Fire (375m)',
      sensor: 'VIIRS',
      dataset: 'NASA_GIBS',
      acquisitionDate: new Date(),
      imageryType: 'THERMAL_ANOMALIES',
      resolution: '375m',
      wmtsTemplate: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_Thermal_Anomalies_375m_All/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
      attribution: 'NASA EOSDIS GIBS / NOAA-20 VIIRS'
    }
  ];

  for (const l of layers) {
    const existing = await prisma.satelliteImageryMetadata.findFirst({ where: { layerId: l.layerId } });
    if (!existing) {
      await prisma.satelliteImageryMetadata.create({ data: l });
    }
  }
  logger.info('Seeded Satellite Imagery Metadata.');

  // 4. Seed Fire Observations
  const now = new Date();
  const insertedObsIds: string[] = [];

  for (const p of SEED_HOTSPOTS) {
    const isViirs = p.sat.includes('VIIRS');
    const sensor = isViirs ? 'VIIRS' : 'MODIS';
    const platform = isViirs
      ? (p.sat.includes('NOAA-20') ? 'NOAA-20' : 'Suomi-NPP')
      : (p.sat.includes('Aqua') ? 'Aqua' : 'Terra');
    const brightnessTemp = Math.round(335 + (p.frp / 440) * 55);
    const scan = isViirs ? 0.375 : 1.0;
    const track = isViirs ? 0.375 : 1.0;

    const obs = await prisma.fireObservation.upsert({
      where: { sourceId: `seed_${p.id}` },
      update: {
        latitude: p.lat,
        longitude: p.lon,
        frp: p.frp,
        confidence: p.conf,
        brightnessTemp,
        scan,
        track,
        dayNight: 'Day (Ascending)',
        observationTime: now
      },
      create: {
        id: p.id,
        latitude: p.lat,
        longitude: p.lon,
        observationTime: now,
        acquisitionDate: now,
        satellitePlatform: platform,
        sensor,
        confidence: p.conf,
        brightnessTemp,
        frp: p.frp,
        scan,
        track,
        dayNight: 'Day (Ascending)',
        sourceDataset: 'NASA_FIRMS_VERIFIED_SEED',
        sourceId: `seed_${p.id}`
      }
    });

    insertedObsIds.push(obs.id);
  }
  logger.info(`Seeded ${insertedObsIds.length} Verified Hotspot Observations.`);

  // 5. Cluster Observations into Incidents
  const clusteredCount = await FirmsIngestionService.clusterAndAssignIncidents();
  logger.info(`Clustered observations into incidents: ${clusteredCount} grouped.`);

  // 6. Seed Sample Weather Observations
  const sampleCoords = [
    { lat: -11.85, lon: -55.50 },
    { lat: 39.80, lon: -120.90 },
    { lat: 45.20, lon: -114.90 },
    { lat: -4.50, lon: 21.80 },
    { lat: -16.50, lon: 133.20 },
    { lat: 23.20, lon: 78.50 }
  ];

  for (const c of sampleCoords) {
    const existing = await prisma.weatherObservation.findFirst({
      where: { latitude: c.lat, longitude: c.lon }
    });
    if (!existing) {
      await prisma.weatherObservation.create({
        data: {
          latitude: c.lat,
          longitude: c.lon,
          temperature: 34.2,
          humidity: 22.0,
          windSpeed: 28.5,
          windDirection: 215,
          precipitation: 0.0,
          airQualityIndex: 168.0,
          observationTime: now,
          dataSource: 'Open-Meteo'
        }
      });
    }
  }
  logger.info('Seeded Weather Observations.');

  // 7. Seed Sample Saved Location and Alert Rule for Analyst
  const savedLoc = await prisma.savedLocation.findFirst({ where: { userId: analyst.id } });
  if (!savedLoc) {
    await prisma.savedLocation.create({
      data: {
        userId: analyst.id,
        name: 'Northern Sierra Wildfire Sector (Plumas)',
        latitude: 39.80,
        longitude: -120.90,
        radiusKm: 75.0
      }
    });
  }

  const alertRule = await prisma.alertRule.findFirst({ where: { userId: analyst.id } });
  if (!alertRule) {
    await prisma.alertRule.create({
      data: {
        userId: analyst.id,
        name: 'High FRP Thermal Outbreak (>350 MW)',
        latitude: 39.80,
        longitude: -120.90,
        radiusKm: 100.0,
        alertType: 'HIGH_INTENSITY',
        threshold: 350.0,
        enabled: true
      }
    });
  }
  logger.info('Seeded User Saved Location and Alert Rule.');

  logger.info('Database seeding completed successfully.');
}

seed()
  .catch((e) => {
    logger.error(`Seed failed: ${e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

