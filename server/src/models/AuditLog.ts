import { Schema, model, Document, CallbackError } from 'mongoose';

export interface IAuditLog extends Document {
  ts: Date;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    ts: { type: Date, required: true, default: () => new Date() },
    actor: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: false,
    // Prevent accidental updates via standard Mongoose update methods
  },
);

/** Enforce append-only: block any update operations at the schema level. */
const BLOCKED_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
] as const;

for (const op of BLOCKED_OPS) {
  AuditLogSchema.pre(op, function (_next: (err?: CallbackError) => void) {
    _next(new Error('AuditLog is append-only: update operations are not permitted'));
  });
}

/** Enforce append-only: block any delete operations at the schema level. */
const BLOCKED_DELETE_OPS = ['deleteOne', 'deleteMany', 'findOneAndDelete'] as const;

for (const op of BLOCKED_DELETE_OPS) {
  AuditLogSchema.pre(op, function (_next: (err?: CallbackError) => void) {
    _next(new Error('AuditLog is append-only: delete operations are not permitted'));
  });
}

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ ts: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
