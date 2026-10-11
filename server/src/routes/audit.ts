import { Router, Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';

export const auditRouter = Router();

auditRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    for (const key of ['entityType', 'entityId', 'actor', 'action']) {
      if (typeof req.query[key] === 'string' && req.query[key]) filter[key] = req.query[key];
    }
    const logs = await AuditLog.find(filter).sort({ ts: -1 }).limit(250).lean().exec();
    res.json(logs);
  } catch (error: unknown) {
    next(error);
  }
});