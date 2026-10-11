import { Router, Request, Response, NextFunction } from 'express';
import { getRuleVersion } from '../config/rulesLoader.js';
import { RuleVersion } from '../models/RuleVersion.js';

export const rulesRouter = Router();

rulesRouter.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const version = getRuleVersion();
    const stored = await RuleVersion.findOne({ version }).lean().exec();
    res.json({ version, yamlText: stored?.yamlText ?? '' });
  } catch (error: unknown) {
    next(error);
  }
});