import { Router, Request, Response, NextFunction } from 'express';
import { getPortfolioExposure } from '../services/portfolio/index.js';

export const portfolioRouter = Router();

portfolioRouter.get('/exposure', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
    res.json(await getPortfolioExposure(eventId));
  } catch (error: unknown) {
    next(error);
  }
});