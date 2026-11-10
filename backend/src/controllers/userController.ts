import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/errorHandler';

export class UserController {
  // Saved Locations
  public static async getSavedLocations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const locations = await prisma.savedLocation.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: locations });
    } catch (err) {
      next(err);
    }
  }

  public static async createSavedLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, latitude, longitude, radiusKm } = req.body;
      const location = await prisma.savedLocation.create({
        data: {
          userId: req.user!.userId,
          name,
          latitude,
          longitude,
          radiusKm: radiusKm || 50
        }
      });
      res.status(201).json({ success: true, data: location });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteSavedLocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const loc = await prisma.savedLocation.findUnique({ where: { id } });
      if (!loc || loc.userId !== req.user!.userId) {
        throw new AppError('Saved location not found', 404);
      }
      await prisma.savedLocation.delete({ where: { id } });
      res.json({ success: true, message: 'Saved location deleted' });
    } catch (err) {
      next(err);
    }
  }

  // Alert Rules
  public static async getAlertRules(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const alerts = await prisma.alertRule.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: alerts });
    } catch (err) {
      next(err);
    }
  }

  public static async createAlertRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, latitude, longitude, radiusKm, alertType, threshold, enabled } = req.body;
      const alert = await prisma.alertRule.create({
        data: {
          userId: req.user!.userId,
          name,
          latitude,
          longitude,
          radiusKm: radiusKm || 50,
          alertType: alertType || 'PROXIMITY',
          threshold,
          enabled: enabled !== undefined ? enabled : true
        }
      });
      res.status(201).json({ success: true, data: alert });
    } catch (err) {
      next(err);
    }
  }

  public static async updateAlertRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await prisma.alertRule.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.userId) {
        throw new AppError('Alert rule not found', 404);
      }
      const updated = await prisma.alertRule.update({
        where: { id },
        data: req.body
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAlertRule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await prisma.alertRule.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.user!.userId) {
        throw new AppError('Alert rule not found', 404);
      }
      await prisma.alertRule.delete({ where: { id } });
      res.json({ success: true, message: 'Alert rule deleted' });
    } catch (err) {
      next(err);
    }
  }
}

