import { Router, Request, Response, NextFunction } from 'express';
import { Account } from '../models/Account.js';
import { DriftEvent } from '../models/DriftEvent.js';
import { Location } from '../models/Location.js';
import { Policy } from '../models/Policy.js';
import { RiskSnapshot } from '../models/RiskSnapshot.js';

export const policiesRouter = Router();

policiesRouter.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.status === 'string' && req.query.status.length > 0) {
      filter.status = req.query.status;
    }
    if (typeof req.query.region === 'string' && req.query.region.length > 0) {
      filter.region = req.query.region;
    }
    if (typeof req.query.search === 'string' && req.query.search.trim().length > 0) {
      const sanitized = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const accountIds = await Account.find({
        name: { $regex: sanitized, $options: 'i' },
      })
        .distinct('accountId')
        .exec();
      filter.$or = [
        { policyId: { $regex: sanitized, $options: 'i' } },
        { accountId: { $in: accountIds } },
      ];
    }

    const policies = await Policy.find(filter).sort({ policyId: 1 }).lean().exec();
    const accountIds = [...new Set(policies.map((policy) => policy.accountId))];
    const accounts = await Account.find({ accountId: { $in: accountIds } }).lean().exec();
    const accountById = new Map(accounts.map((account) => [account.accountId, account]));

    res.json(
      policies.map((policy) => ({
        ...policy,
        account: accountById.get(policy.accountId) ?? null,
      })),
    );
  } catch (error: unknown) {
    next(error);
  }
});

policiesRouter.get('/:policyId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const policy = await Policy.findOne({ policyId: req.params.policyId }).lean().exec();
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    const [account, locations, latestSnapshot, drift] = await Promise.all([
      Account.findOne({ accountId: policy.accountId }).lean().exec(),
      Location.find({ policyId: policy.policyId }).sort({ locationId: 1 }).lean().exec(),
      RiskSnapshot.findOne({ policyId: policy.policyId }).sort({ takenAt: -1 }).lean().exec(),
      DriftEvent.find({ policyId: policy.policyId }).sort({ createdAt: -1 }).lean().exec(),
    ]);

    res.json({ policy, account: account ?? null, locations, latestSnapshot: latestSnapshot ?? null, drift });
  } catch (error: unknown) {
    next(error);
  }
});