import { Router, Request, Response, NextFunction } from 'express';
import { Activity } from '../models/Activity.js';

export const activitiesRouter = Router();

activitiesRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    for (const key of ['assigneeUserId', 'status', 'eventId', 'policyId']) {
      if (typeof req.query[key] === 'string' && req.query[key]) filter[key] = req.query[key];
    }
    res.json(await Activity.find(filter).sort({ dueDate: 1 }).lean().exec());
  } catch (error: unknown) {
    next(error);
  }
});