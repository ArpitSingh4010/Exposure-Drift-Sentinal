import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { currentUser } from './middleware/currentUser.js';
import { healthRouter } from './routes/health.js';
import { adminRouter } from './routes/admin.js';
import { policiesRouter } from './routes/policies.js';
import { signalsRouter } from './routes/signals.js';
import { guidewireMockRouter } from './guidewireMock/router.js';
import { eventsRouter } from './routes/events.js';
import { activitiesRouter } from './routes/activities.js';
import { portfolioRouter } from './routes/portfolio.js';
import { auditRouter } from './routes/audit.js';
import { rulesRouter } from './routes/rules.js';
import { simulatorRouter } from './routes/simulator.js';
import { logger } from './config/logger.js';

/**
 * Creates and configures the Express application.
 * Exported separately from server.ts so it can be imported by tests
 * without starting the HTTP listener.
 */
export function createApp(): express.Application {
  const app = express();

  // ── Body parsing ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── CORS (dev) ────────────────────────────────────────────────────────────
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // ── Request logging ───────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, 'incoming request');
    next();
  });

  // ── Auth (no real auth; reads X-User-Id header) ───────────────────────────
  app.use(currentUser);

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/health', healthRouter);
  app.use('/admin', adminRouter);
  app.use('/policies', policiesRouter);
  app.use('/signals', signalsRouter);
  app.use('/pc', guidewireMockRouter);
  app.use('/events', eventsRouter);
  app.use('/activities', activitiesRouter);
  app.use('/portfolio', portfolioRouter);
  app.use('/audit', auditRouter);
  app.use('/rules', rulesRouter);
  app.use('/simulator', simulatorRouter);

  // TODO(P2+): mount remaining routers here as phases progress
  // app.use('/signals', signalsRouter);
  // app.use('/events', eventsRouter);
  // app.use('/activities', activitiesRouter);
  // app.use('/policies', policiesRouter);
  // app.use('/portfolio', portfolioRouter);
  // app.use('/audit', auditRouter);
  // app.use('/rules', rulesRouter);
  // app.use('/simulator', simulatorRouter);
  // app.use('/admin', adminRouter);
  // app.use('/pc', guidewireMockRouter);

  // ── Error handler (must be last) ──────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
