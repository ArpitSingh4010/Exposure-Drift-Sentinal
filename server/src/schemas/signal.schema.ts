import { z } from 'zod';

const floodZone = z.enum(['X', 'B', 'A', 'AE', 'V']);

const propertyChangePayload = z.object({
  change: z.enum(['NEW_LOCATION', 'TIV_CHANGE']),
  addressLine: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  tiv: z.number().positive(),
  locationId: z.string().trim().min(1).optional(),
  floodZone: floodZone.optional(),
  floodScore: z.number().int().min(1).max(10).optional(),
});

const floodUpdatePayload = z
  .object({
    locationId: z.string().trim().min(1).optional(),
    addressLine: z.string().trim().min(1).optional(),
    postalCode: z.string().trim().min(1).optional(),
    floodZone: floodZone.optional(),
    floodScore: z.number().int().min(1).max(10).optional(),
  })
  .refine(
    (payload) => Boolean(payload.locationId || (payload.addressLine && payload.postalCode)),
    'locationId or addressLine and postalCode is required',
  )
  .refine(
    (payload) => payload.floodZone !== undefined || payload.floodScore !== undefined,
    'floodZone or floodScore is required',
  );

export const signalBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PROPERTY_CHANGE'),
    source: z.string().trim().min(1),
    observedAt: z.coerce.date(),
    policyId: z.string().trim().min(1).optional(),
    insuredName: z.string().trim().min(1).optional(),
    payload: propertyChangePayload,
  }),
  z.object({
    type: z.literal('FLOOD_UPDATE'),
    source: z.string().trim().min(1),
    observedAt: z.coerce.date(),
    policyId: z.string().trim().min(1).optional(),
    insuredName: z.string().trim().min(1).optional(),
    payload: floodUpdatePayload,
  }),
]);

export const signalRequestSchema = z.object({ body: signalBodySchema });
export type SignalRequest = z.infer<typeof signalBodySchema>;