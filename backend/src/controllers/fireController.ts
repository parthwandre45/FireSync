import { Request, Response, NextFunction } from 'express';
import { FireService } from '../services/fireService';
import { FireQueryParams } from '../types';

export class FireController {
  public static async getFires(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query;
      const params: FireQueryParams = {
        minLat: q.minLat !== undefined ? parseFloat(q.minLat as string) : undefined,
        maxLat: q.maxLat !== undefined ? parseFloat(q.maxLat as string) : undefined,
        minLon: q.minLon !== undefined ? parseFloat(q.minLon as string) : undefined,
        maxLon: q.maxLon !== undefined ? parseFloat(q.maxLon as string) : undefined,
        confidence: q.confidence !== undefined ? parseFloat(q.confidence as string) : undefined,
        minFrp: q.minFrp !== undefined ? parseFloat(q.minFrp as string) : undefined,
        sensor: q.sensor as string,
        satellite: q.satellite as string,
        dayNight: q.dayNight as string,
        timeRange: q.timeRange as any,
        limit: q.limit ? parseInt(q.limit as string, 10) : 500,
        offset: q.offset ? parseInt(q.offset as string, 10) : 0,
        sortBy: q.sortBy as any,
        sortOrder: q.sortOrder as any
      };

      const result = await FireService.queryFires(params);
      res.json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          limit: params.limit,
          offset: params.offset,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getFireById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fire = await FireService.getById(req.params.id);
      if (!fire) {
        res.status(404).json({ success: false, error: 'Fire observation not found' });
        return;
      }
      res.json({ success: true, data: fire });
    } catch (err) {
      next(err);
    }
  }

  public static async getNearbyFires(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 100;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({ success: false, error: 'Valid lat and lon query parameters are required' });
        return;
      }

      const fires = await FireService.findNearby(lat, lon, radiusKm, limit);
      res.json({ success: true, data: fires });
    } catch (err) {
      next(err);
    }
  }

  public static async getRegions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const regions = await FireService.getRegionalActivity();
      res.json({ success: true, data: regions });
    } catch (err) {
      next(err);
    }
  }

  public static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await FireService.getDashboardOverview();
      res.json({ success: true, data: overview });
    } catch (err) {
      next(err);
    }
  }
}

