"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelliteService = void 0;
const prisma_1 = require("../db/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
class SatelliteService {
    static async listMissions() {
        const missions = await prisma_1.prisma.satelliteMission.findMany({
            orderBy: { missionCode: 'asc' }
        });
        const totalObs = await prisma_1.prisma.fireObservation.count();
        const dtos = await Promise.all(missions.map(async (m) => {
            const count = await prisma_1.prisma.fireObservation.count({
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
        }));
        return dtos;
    }
    static async getMissionByCode(code) {
        const m = await prisma_1.prisma.satelliteMission.findFirst({
            where: {
                OR: [
                    { missionCode: { equals: code, mode: 'insensitive' } },
                    { id: code }
                ]
            }
        });
        if (!m) {
            throw new errorHandler_1.AppError(`Satellite mission ${code} not found`, 404);
        }
        const count = await prisma_1.prisma.fireObservation.count({
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
    static async listImageryLayers() {
        return prisma_1.prisma.satelliteImageryMetadata.findMany({
            where: { isAvailable: true },
            orderBy: { acquisitionDate: 'desc' }
        });
    }
}
exports.SatelliteService = SatelliteService;
