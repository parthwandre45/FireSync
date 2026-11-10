import { Request, Response, NextFunction } from 'express';
import { SatelliteService } from '../services/satelliteService';

export class SatelliteController {
  public static async getSatellites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const missions = await SatelliteService.listMissions();
      res.json({
        success: true,
        data: missions
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getSatelliteByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mission = await SatelliteService.getMissionByCode(req.params.code);
      res.json({
        success: true,
        data: mission
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getImageryLayers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const layers = await SatelliteService.listImageryLayers();
      res.json({
        success: true,
        data: layers
      });
    } catch (err) {
      next(err);
    }
  }
}

