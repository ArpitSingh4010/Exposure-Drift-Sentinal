import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Reads X-User-Id header and attaches it to res.locals.userId.
 * No real authentication — documented in README.
 * Missing header is allowed on public routes; controllers can check res.locals.userId.
 */
export function currentUser(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'];
  if (typeof userId === 'string' && userId.trim().length > 0) {
    res.locals.userId = userId.trim();
  } else {
    // Allow unauthenticated through; protected controllers throw explicitly
    res.locals.userId = null;
  }
  next();
}

/** Throws 401 if no user is present. Use on routes that require a user. */
export function requireUser(_req: Request, res: Response, next: NextFunction): void {
  if (!res.locals.userId) {
    next(new AppError(401, 'X-User-Id header is required'));
    return;
  }
  next();
}
