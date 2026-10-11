import { Router, Request, Response, NextFunction } from 'express';
import { signalRequestSchema, type SignalRequest } from '../schemas/signal.schema.js';
import { ingestSignal } from '../services/signals/index.js';

export const signalsRouter = Router();

signalsRouter.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = signalRequestSchema.parse({ body: req.body }).body as SignalRequest;
    const result = await ingestSignal(parsed);
    res.status(result.unmatched ? 202 : 201).json(result);
  } catch (error: unknown) {
    next(error);
  }
});