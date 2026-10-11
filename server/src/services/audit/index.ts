import type { ClientSession } from 'mongoose';
import { AuditLog } from '../../models/AuditLog.js';

export interface AuditInput {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}

export async function appendAudit(input: AuditInput, session?: ClientSession): Promise<void> {
  await AuditLog.create([{
    ts: new Date(),
    actor: input.actor,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    details: input.details ?? {},
  }], { session });
}