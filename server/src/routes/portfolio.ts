import { Router, Request, Response, NextFunction } from 'express';
import { getPortfolioExposure, getPortfolioSummary } from '../services/portfolio/index.js';
import type { HazardId } from '../services/hazards/index.js';

export const portfolioRouter = Router();

portfolioRouter.get('/exposure', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
    const hazard = typeof req.query.hazard === 'string' ? (req.query.hazard as HazardId) : undefined;
    res.json(await getPortfolioExposure(eventId, hazard));
  } catch (error: unknown) {
    next(error);
  }
});

portfolioRouter.get('/summary', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getPortfolioSummary());
  } catch (error: unknown) {
    next(error);
  }
});
