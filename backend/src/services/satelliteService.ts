import { prisma } from '../db/prisma';
import { SatelliteMissionDto } from '../types';
import { AppError } from '../middleware/errorHandler';

export class SatelliteService {
  public static async listMissions(): Promise<SatelliteMissionDto[]> {
    const missions = await prisma.satelliteMission.findMany({
      orderBy: { missionCode: 'asc' }
    });

    const totalObs = await prisma.fireObservation.count();

    const dtos: SatelliteMissionDto[] = await Promise.all(
      missions.map(async (m) => {
        const count = await prisma.fireObservation.count({
          where: { satellitePlatform: m.satellitePlatform }
        });

        const share = totalObs > 0 ? Math.round((count / totalObs) * 100) : 25;

        return {
          id: m.id,
          missionCode: m.missionCode,
          name: m.name,
          satellitePlatform: m.satellitePlatform,
          sensor: m.sensor,
          description: m.description,
          orbitType: m.orbitType,
          altitudeKm: m.altitudeKm,
          inclinationDeg: m.inclinationDeg,
          spatialResolution: m.spatialResolution,
          spectralBands: m.spectralBands,
          swathWidthKm: m.swathWidthKm,
          overpassTime: m.overpassTime,
          status: m.status,
          dataSource: m.dataSource,
          latestPassUtc: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
          detectionCount: count,
          operationalStatus: 'NOMINAL',
          dataLatency: m.sensor === 'VIIRS' ? '< 3 hours' : '< 4.5 hours',
          coverageShare: share
        };
      })
    );

    return dtos;
  }

  public static async getMissionByCode(code: string): Promise<SatelliteMissionDto> {
    const m = await prisma.satelliteMission.findFirst({
      where: {
        OR: [
          { missionCode: { equals: code, mode: 'insensitive' } },
          { id: code }
        ]
      }
    });

    if (!m) {
      throw new AppError(`Satellite mission ${code} not found`, 404);
    }

    const count = await prisma.fireObservation.count({
      where: { satellitePlatform: m.satellitePlatform }
    });

    return {
      id: m.id,
      missionCode: m.missionCode,
      name: m.name,
      satellitePlatform: m.satellitePlatform,
      sensor: m.sensor,
      description: m.description,
      orbitType: m.orbitType,
      altitudeKm: m.altitudeKm,
      inclinationDeg: m.inclinationDeg,
      spatialResolution: m.spatialResolution,
      spectralBands: m.spectralBands,
      swathWidthKm: m.swathWidthKm,
      overpassTime: m.overpassTime,
      status: m.status,
      dataSource: m.dataSource,
      latestPassUtc: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      detectionCount: count,
      operationalStatus: 'NOMINAL',
      dataLatency: '< 3 hours',
      coverageShare: 28
    };
  }

  public static async listImageryLayers() {
    return prisma.satelliteImageryMetadata.findMany({
      where: { isAvailable: true },
      orderBy: { acquisitionDate: 'desc' }
    });
  }
}

