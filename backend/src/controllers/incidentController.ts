import { Request, Response, NextFunction } from 'express';
import { IncidentService } from '../services/incidentService';

export class IncidentController {
  public static async getIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query;
      const params = {
        status: q.status as string,
        minLat: q.minLat !== undefined ? parseFloat(q.minLat as string) : undefined,
        maxLat: q.maxLat !== undefined ? parseFloat(q.maxLat as string) : undefined,
        minLon: q.minLon !== undefined ? parseFloat(q.minLon as string) : undefined,
        maxLon: q.maxLon !== undefined ? parseFloat(q.maxLon as string) : undefined,
        limit: q.limit ? parseInt(q.limit as string, 10) : 100,
        offset: q.offset ? parseInt(q.offset as string, 10) : 0
      };

      const result = await IncidentService.listIncidents(params);
      res.json({
        success: true,
        data: result.items,
        meta: {
          total: result.total,
          limit: params.limit,
          offset: params.offset
        }
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.getIncidentById(req.params.id);
      res.json({
        success: true,
        data: incident
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getIncidentObservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await IncidentService.getIncidentById(req.params.id);
      res.json({
        success: true,
        data: incident.observations
      });
    } catch (err) {
      next(err);
    }
  }
}

