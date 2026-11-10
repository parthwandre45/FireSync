export interface SatelliteInfo {
  id: 'MODIS' | 'VIIRS';
  fullName: string;
  instrumentName: string;
  spacecraft: string;
  orbitType: string;
  altitude: string;
  inclination: string;
  spatialResolution: string;
  spectralBands: string;
  overpassTime: string;
  missionStatus: string;
  swathWidth: string;
  sensorTemp: string;
  description: string;
  keyRole: string;
  accentColor: string;
}

export const SATELLITE_DATA: Record<'MODIS' | 'VIIRS', SatelliteInfo> = {
  MODIS: {
    id: 'MODIS',
    fullName: 'Moderate Resolution Imaging Spectroradiometer',
    instrumentName: 'MODIS (Terra & Aqua)',
    spacecraft: 'EOS AM-1 (Terra) & EOS PM-1 (Aqua)',
    orbitType: 'Sun-synchronous Near-Polar Low Earth Orbit (LEO)',
    altitude: '705 kilometers (438 miles)',
    inclination: '98.2 degrees',
    spatialResolution: '250m, 500m, and 1,000m (Thermal IR)',
    spectralBands: '36 Spectral Bands (0.4 µm to 14.4 µm)',
    overpassTime: 'Terra: 10:30 AM (Descending) | Aqua: 1:30 PM (Ascending)',
    missionStatus: 'ACTIVE // NOMINAL TELEMETRY',
    swathWidth: '2,330 km (Daily Global Revisit)',
    sensorTemp: '85.2 K (Active Passive Radiator Cryocooled)',
    description:
      'MODIS is a flagship NASA Earth Observing System (EOS) radiometer aboard the Terra and Aqua spacecraft. For over 24 consecutive years, it has tracked global wildfire emissions, radiative power (FRP), and smoke plume dynamics across 36 spectral channels.',
    keyRole: 'Benchmark decadal climate baseline, regional wildfire tracking, and total biomass combustion estimates.',
    accentColor: '#00e5ff',
  },
  VIIRS: {
    id: 'VIIRS',
    fullName: 'Visible Infrared Imaging Radiometer Suite',
    instrumentName: 'VIIRS (Suomi-NPP & NOAA-20)',
    spacecraft: 'Suomi-NPP (SNPP) & JPSS-1 (NOAA-20)',
    orbitType: 'Sun-synchronous Polar Low Earth Orbit (LEO)',
    altitude: '824 kilometers (512 miles)',
    inclination: '98.7 degrees',
    spatialResolution: '375m (I-Bands High Resolution) & 750m (M-Bands)',
    spectralBands: '22 Imaging and Radiometric Bands',
    overpassTime: '1:30 PM Local Solar Time (Afternoon Constellation)',
    missionStatus: 'ACTIVE // HIGH-RESOLUTION STREAM',
    swathWidth: '3,060 km (Full Global Daily Coverage with No Nadir Gap)',
    sensorTemp: '80.0 K (Stirling Cryocooled Dewar)',
    description:
      'VIIRS is the next-generation scanning radiometer aboard NOAA/NASA Joint Polar Satellite System spacecraft. Its flagship 375m I-Band active fire algorithm resolves firelines with 7x finer areal resolution than MODIS, detecting spot fires as small as 10–25 m².',
    keyRole: 'High-precision wildfire perimeter mapping, early ignition detection, and nighttime thermal anomaly reconnaissance.',
    accentColor: '#ff5722',
  },
};

