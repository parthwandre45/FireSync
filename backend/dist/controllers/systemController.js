"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const prisma_1 = require("../db/prisma");
const firmsIngestionService_1 = require("../services/firmsIngestionService");
class SystemController {
    static async getHealth(req, res, next) {
        try {
            const dbStatus = await (0, prisma_1.checkDatabaseConnection)();
            const memoryUsage = process.memoryUsage();
            const health = {
                status: dbStatus.ok ? 'HEALTHY' : 'DEGRADED',
                timestamp: new Date().toISOString(),
                uptimeSeconds: Math.round(process.uptime()),
                database: {
                    connected: dbStatus.ok,
                    latencyMs: dbStatus.latencyMs,
                    error: dbStatus.error
                },
                memory: {
                    heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
                },
                environment: process.env.NODE_ENV || 'development'
            };
            res.status(dbStatus.ok ? 200 : 503).json({
                success: dbStatus.ok,
                data: health
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getDataSources(req, res, next) {
        try {
            const latestLog = await prisma_1.prisma.dataIngestionLog.findFirst({
                orderBy: { startTime: 'desc' }
            });
            const sources = [
                {
                    name: 'NASA FIRMS (MODIS & VIIRS)',
                    type: 'Active Fire Radiative Power',
                    status: 'ONLINE // NOMINAL',
                    latency: '< 3 hours',
                    lastIngested: latestLog ? latestLog.startTime.toISOString() : new Date().toISOString()
                },
                {
                    name: 'NASA GIBS (Global Imagery Browse Services)',
                    type: 'WMTS Surface Reflectance Tiles',
                    status: 'ONLINE // EPSG:3857',
                    resolution: '250m - 1km native',
                    latency: 'Near Real-Time (< 4.5h)'
                },
                {
                    name: 'Open-Meteo Atmospheric Services',
                    type: 'Meteorological & Surface Wind Telemetry',
                    status: 'ONLINE // LIVE SYNC',
                    resolution: 'Spatial point-level',
                    latency: '< 1 hour'
                },
                {
                    name: 'PostgreSQL & EarthDistance Spatial Engine',
                    type: 'Geospatial Indexing & Incident Clustering',
                    status: 'ONLINE // DUAL-INDEXED',
                    mode: 'B-tree Composite + ll_to_earth GiST'
                }
            ];
            res.json({
                success: true,
                data: sources
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async getIngestionStatus(req, res, next) {
        try {
            const logs = await prisma_1.prisma.dataIngestionLog.findMany({
                orderBy: { startTime: 'desc' },
                take: 20
            });
            res.json({
                success: true,
                data: logs
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async triggerIngestion(req, res, next) {
        try {
            // Run sync in background or immediately
            firmsIngestionService_1.FirmsIngestionService.executeSyncJob().catch(console.error);
            res.json({
                success: true,
                message: 'Data ingestion job dispatched successfully'
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.SystemController = SystemController;
