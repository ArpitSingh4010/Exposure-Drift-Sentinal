import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

/** Shape of all error responses in this API */
export interface ApiError {
  error: string;
  detail?: unknown;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', detail: err.flatten() } satisfies ApiError);
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, detail: err.detail } satisfies ApiError);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' } satisfies ApiError);
}

/** Domain error with an HTTP status code */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
