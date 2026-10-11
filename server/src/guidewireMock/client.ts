import { randomUUID } from 'crypto';
import { addBusinessDays } from 'date-fns';
import type { ClientSession } from 'mongoose';
import { Account } from '../models/Account.js';
import { Activity, type ActivityPriority, type IActivity } from '../models/Activity.js';
import { Location } from '../models/Location.js';
import { Policy } from '../models/Policy.js';
import { PortfolioConfig } from '../models/PortfolioConfig.js';
import { RiskSnapshot } from '../models/RiskSnapshot.js';
import { User } from '../models/User.js';

export interface CreateActivityInput {
  eventId: string;
  policyId: string;
  subject: string;
  description: string;
  priority: ActivityPriority;
  dueBusinessDays: number;
  assigneeUserId?: string;
  seniorFlag?: string;
}

export interface CompleteActivityInput {
  outcome: string;
  note: string;
}

export interface GuidewireClient {
  getPolicy(policyId: string, session?: ClientSession): Promise<unknown>;
  getAccount(accountId: string, session?: ClientSession): Promise<unknown>;
  createActivity(input: CreateActivityInput, session?: ClientSession): Promise<IActivity>;
  completeActivity(
    activityId: string,
    input: CompleteActivityInput,
    session?: ClientSession,
  ): Promise<IActivity>;
}

export class InProcessGuidewireClient implements GuidewireClient {
  async getPolicy(policyId: string, session?: ClientSession): Promise<unknown> {
    const policyQuery = Policy.findOne({ policyId }).lean();
    if (session) policyQuery.session(session);
    const policy = await policyQuery.exec();
    if (!policy) return null;
    const locationsQuery = Location.find({ policyId }).sort({ locationId: 1 }).lean();
    const snapshotQuery = RiskSnapshot.findOne({ policyId }).sort({ takenAt: -1 }).lean();
    if (session) {
      locationsQuery.session(session);
      snapshotQuery.session(session);
    }
    const [locations, latestSnapshot] = await Promise.all([
      locationsQuery.exec(),
      snapshotQuery.exec(),
    ]);
    return { policy, locations, latestSnapshot: latestSnapshot ?? null };
  }

  async getAccount(accountId: string, session?: ClientSession): Promise<unknown> {
    const query = Account.findOne({ accountId }).lean();
    if (session) query.session(session);
    return query.exec();
  }

  async createActivity(input: CreateActivityInput, session?: ClientSession): Promise<IActivity> {
    let assigneeUserId = input.assigneeUserId;
    if (!assigneeUserId) {
      const underwritersQuery = User.find({ role: 'UNDERWRITER' }).sort({ userId: 1 }).lean();
      if (session) underwritersQuery.session(session);
      const underwriters = await underwritersQuery.exec();
      if (underwriters.length === 0) throw new Error('No underwriter is available for assignment');
      const counter = await PortfolioConfig.findOneAndUpdate(
        { key: 'activityAssigneeIdx' },
        { $inc: { value: 1 } },
        { new: true, upsert: true, session, setDefaultsOnInsert: true },
      ).lean().exec();
      const index = Math.max(0, Number(counter?.value ?? 1) - 1) % underwriters.length;
      const assignee = underwriters[index];
      if (!assignee) throw new Error('Assignee rotation returned no user');
      assigneeUserId = assignee.userId;
    }

    const [activity] = await Activity.create([{
      activityId: `ACT-${randomUUID()}`,
      eventId: input.eventId,
      policyId: input.policyId,
      assigneeUserId,
      seniorFlag: input.seniorFlag,
      subject: input.subject,
      description: input.description,
      priority: input.priority,
      dueDate: addBusinessDays(new Date(), input.dueBusinessDays),
      status: 'OPEN',
    }], { session });
    if (!activity) throw new Error('Guidewire mock activity creation failed');
    return activity;
  }

  async completeActivity(
    activityId: string,
    input: CompleteActivityInput,
    session?: ClientSession,
  ): Promise<IActivity> {
    const activityQuery = Activity.findOne({ activityId });
    if (session) activityQuery.session(session);
    const activity = await activityQuery.exec();
    if (!activity) throw new Error(`Activity not found: ${activityId}`);
    activity.status = 'COMPLETED';
    activity.completedAt = new Date();
    await activity.save({ session });
    return activity;
  }
}

export const guidewireClient: GuidewireClient = new InProcessGuidewireClient();