import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error(`Critical AppError: ${err.message}`, { stack: err.stack, path: req.path });
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Unhandled / server errors
  logger.error(`Unhandled Error on ${req.method} ${req.path}: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
}

