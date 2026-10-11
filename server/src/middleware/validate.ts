import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Express middleware that validates req.body, req.query, and req.params
 * against a Zod schema. Calls next(ZodError) on failure so errorHandler formats it.
 */
export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      next(result.error);
      return;
    }
    // Attach parsed (coerced/defaulted) values back to req
    const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.query !== undefined) req.query = parsed.query as Record<string, string>;
    if (parsed.params !== undefined) req.params = parsed.params as Record<string, string>;
    next();
  };
}
