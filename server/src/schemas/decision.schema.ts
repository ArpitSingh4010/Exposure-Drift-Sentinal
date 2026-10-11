import { z } from 'zod';

export const decisionBodySchema = z
  .object({
    action: z.enum(['ACCEPT', 'DISMISS', 'REQUEST_INFO']),
    reasonCode: z.enum(['not_material', 'wrong_match', 'already_known', 'other']).optional(),
    note: z.string().trim().min(1),
  })
  .superRefine((body, context) => {
    if (body.action === 'DISMISS' && !body.reasonCode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'reasonCode is required when dismissing an event',
      });
    }
  });

export type DecisionBody = z.infer<typeof decisionBodySchema>;