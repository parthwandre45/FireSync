import { Request, Response, NextFunction } from 'express';
import { WeatherService } from '../services/weatherService';

export class WeatherController {
  public static async getNearby(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        res.status(400).json({
          success: false,
          error: 'Valid lat and lon query parameters are required'
        });
        return;
      }

      const weather = await WeatherService.getNearbyWeather(lat, lon);
      res.json({
        success: true,
        data: weather
      });
    } catch (err) {
      next(err);
    }
  }
}

