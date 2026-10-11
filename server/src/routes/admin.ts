import { Router, Request, Response } from 'express';
import { seedDb } from '../seed/index.js';
import { loadAndStoreRules } from '../config/rulesLoader.js';
import { logger } from '../config/logger.js';

export const adminRouter = Router();

/**
 * POST /admin/reset-demo
 * Wipes all collections (deleteMany, NOT in a transaction — amendment #2)
 * and re-seeds to the deterministic state, then reloads rules.
 */
adminRouter.post('/reset-demo', (_req: Request, res: Response): void => {
  // Fire-and-forget pattern: respond 202 immediately then run seed
  // so the UI can show "resetting…" without a 30s timeout.
  res.status(202).json({ message: 'Demo reset started. This takes ~5 seconds.' });

  void seedDb()
    .then(() => loadAndStoreRules())
    .then(() => logger.info('reset-demo complete'))
    .catch((err: unknown) => logger.error({ err }, 'reset-demo failed'));
});
