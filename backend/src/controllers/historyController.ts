import { Request, Response, NextFunction } from 'express';
import { HistoryService } from '../services/historyService';

export class HistoryController {
  public static async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const region = req.query.region as string;
      const periodType = req.query.periodType as string;
      const stats = await HistoryService.getHistoricalStatistics(region, periodType);
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
}

