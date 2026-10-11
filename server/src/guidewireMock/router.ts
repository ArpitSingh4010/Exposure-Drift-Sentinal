import { Router, Request, Response, NextFunction } from 'express';
import { guidewireClient } from './client.js';

export const guidewireMockRouter = Router();

guidewireMockRouter.get('/policies/:policyId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const policyId = req.params.policyId;
    if (typeof policyId !== 'string') {
      res.status(400).json({ error: 'Policy id is required' });
      return;
    }
    res.json(await guidewireClient.getPolicy(policyId));
  } catch (error: unknown) {
    next(error);
  }
});

guidewireMockRouter.get('/accounts/:accountId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const accountId = req.params.accountId;
    if (typeof accountId !== 'string') {
      res.status(400).json({ error: 'Account id is required' });
      return;
    }
    res.json(await guidewireClient.getAccount(accountId));
  } catch (error: unknown) {
    next(error);
  }
});

guidewireMockRouter.post('/policies/:policyId/activities', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await guidewireClient.createActivity({
      ...req.body,
      policyId: req.params.policyId,
    });
    res.status(201).json(activity);
  } catch (error: unknown) {
    next(error);
  }
});

guidewireMockRouter.post('/activities/:activityId/complete', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activityId = req.params.activityId;
    if (typeof activityId !== 'string') {
      res.status(400).json({ error: 'Activity id is required' });
      return;
    }
    res.json(await guidewireClient.completeActivity(activityId, req.body));
  } catch (error: unknown) {
    next(error);
  }
});