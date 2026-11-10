import { Request, Response, NextFunction } from 'express';
import { FireService } from '../services/fireService';

export class DashboardController {
  public static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await FireService.getDashboardOverview();
      res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await FireService.getDashboardOverview();
      const regional = await FireService.getRegionalActivity();

      res.json({
        success: true,
        data: {
          overview,
          topRegions: regional.slice(0, 5),
          meta: {
            telemetrySync: 'NOMINAL',
            sensorPlatforms: ['Terra MODIS', 'Aqua MODIS', 'Suomi-NPP VIIRS', 'NOAA-20 VIIRS']
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trends = await FireService.getDiurnalTrends();
      res.json({
        success: true,
        data: trends
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getRegionalActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await FireService.getRegionalActivity();
      res.json({
        success: true,
        data: activity
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getSensorComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const all = await FireService.queryFires({ limit: 2000 });
      const viirs = all.items.filter((i) => i.sensorFamily === 'VIIRS');
      const modis = all.items.filter((i) => i.sensorFamily === 'MODIS');

      const avgViirsFrp = viirs.length > 0 ? Math.round(viirs.reduce((s, x) => s + x.frp, 0) / viirs.length) : 0;
      const avgModisFrp = modis.length > 0 ? Math.round(modis.reduce((s, x) => s + x.frp, 0) / modis.length) : 0;

      res.json({
        success: true,
        data: {
          viirs: {
            observationCount: viirs.length,
            avgFrp: avgViirsFrp,
            spatialResolution: '375m I-Band',
            dayNightRatio: '65% / 35%',
            plumePenetration: 'Superior'
          },
          modis: {
            observationCount: modis.length,
            avgFrp: avgModisFrp,
            spatialResolution: '1km Multi-spectral',
            dayNightRatio: '58% / 42%',
            legacyBaseline: '24+ Years Long-Term Climate Archive'
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

