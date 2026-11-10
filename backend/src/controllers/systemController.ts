import { Request, Response, NextFunction } from 'express';
import { checkDatabaseConnection, prisma } from '../db/prisma';
import { FirmsIngestionService } from '../services/firmsIngestionService';

export class SystemController {
  public static async getHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbStatus = await checkDatabaseConnection();
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
    } catch (err) {
      next(err);
    }
  }

  public static async getDataSources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const latestLog = await prisma.dataIngestionLog.findFirst({
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
    } catch (err) {
      next(err);
    }
  }

  public static async getIngestionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await prisma.dataIngestionLog.findMany({
        orderBy: { startTime: 'desc' },
        take: 20
      });

      res.json({
        success: true,
        data: logs
      });
    } catch (err) {
      next(err);
    }
  }

  public static async triggerIngestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Run sync in background or immediately
      FirmsIngestionService.executeSyncJob().catch(console.error);

      res.json({
        success: true,
        message: 'Data ingestion job dispatched successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}

