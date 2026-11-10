import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUserPayload, UserRole } from '../types';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch {
    // Expired or invalid token
    next(new AppError('Invalid or expired authentication token', 401));
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication Required',
      message: 'You must be signed in to perform this operation'
    });
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication Required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient administrative privileges'
      });
      return;
    }

    next();
  };
}

