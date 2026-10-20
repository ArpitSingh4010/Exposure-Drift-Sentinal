import { Router, Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/AuditLog.js';

export const auditRouter = Router();

auditRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.entityType === 'string' && req.query.entityType.trim()) {
      const et = req.query.entityType.trim();
      const snake = et.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
      filter.entityType = { $in: [et, snake, et.toUpperCase()] };
    }
    if (typeof req.query.actor === 'string' && req.query.actor.trim()) {
      filter.actor = { $regex: new RegExp(`^${req.query.actor.trim()}$`, 'i') };
    }
    if (typeof req.query.action === 'string' && req.query.action.trim()) {
      filter.action = { $regex: new RegExp(`^${req.query.action.trim()}$`, 'i') };
    }
    if (typeof req.query.entityId === 'string' && req.query.entityId.trim()) {
      filter.entityId = req.query.entityId.trim();
    }
    const logs = await AuditLog.find(filter).sort({ ts: -1 }).limit(250).lean().exec();
    res.json(logs);
  } catch (error: unknown) {
    next(error);
  }
});