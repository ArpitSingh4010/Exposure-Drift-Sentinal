import { Router } from 'express';

export const healthRouter = Router();

/**
 * GET /health
 * Liveness probe. Returns 200 with server timestamp.
 * Does NOT check DB connectivity (use a readiness probe for that).
 */
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), service: 'exposure-drift-sentinel' });
});
