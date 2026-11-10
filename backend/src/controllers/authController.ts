import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  }

  public static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      const profile = await AuthService.getProfile(req.user.userId);
      res.json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }
}

