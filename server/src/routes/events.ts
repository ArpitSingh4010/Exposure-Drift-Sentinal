import { Router, Request, Response, NextFunction } from 'express';
import { requireUser } from '../middleware/currentUser.js';
import { DriftEvent } from '../models/DriftEvent.js';
import { decisionBodySchema } from '../schemas/decision.schema.js';
import { decideEvent, reopenEvent, startReview } from '../services/events/workflow.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    for (const key of ['status', 'severity', 'policyId']) {
      if (typeof req.query[key] === 'string' && req.query[key]) filter[key] = req.query[key];
    }
    res.json(await DriftEvent.find(filter).sort({ createdAt: -1 }).lean().exec());
  } catch (error: unknown) {
    next(error);
  }
});

eventsRouter.get('/:eventId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const event = await DriftEvent.findOne({ eventId: req.params.eventId }).lean().exec();
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error: unknown) {
    next(error);
  }
});

eventsRouter.post('/:eventId/start-review', requireUser, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    if (typeof eventId !== 'string') {
      res.status(400).json({ error: 'Event id is required' });
      return;
    }
    res.json(await startReview(eventId, res.locals.userId as string));
  } catch (error: unknown) {
    next(error);
  }
});

eventsRouter.post('/:eventId/reopen', requireUser, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.eventId;
    if (typeof eventId !== 'string') {
      res.status(400).json({ error: 'Event id is required' });
      return;
    }
    res.json(await reopenEvent(eventId, res.locals.userId as string));
  } catch (error: unknown) {
    next(error);
  }
});

eventsRouter.post('/:eventId/decision', requireUser, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const decision = decisionBodySchema.parse(req.body);
    const eventId = req.params.eventId;
    if (typeof eventId !== 'string') {
      res.status(400).json({ error: 'Event id is required' });
      return;
    }
    res.json(await decideEvent(eventId, res.locals.userId as string, decision));
  } catch (error: unknown) {
    next(error);
  }
});