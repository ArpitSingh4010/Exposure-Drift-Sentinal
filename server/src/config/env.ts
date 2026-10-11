import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  /**
   * Mongo URI. For host-run dev, use:
   *   mongodb://localhost:27017/eds?replicaSet=rs0&directConnection=true
   * For Docker Compose, directConnection=false (uses mongo DNS name).
   */
  MONGO_URI: z
    .string()
    .default('mongodb://localhost:27017/eds?replicaSet=rs0&directConnection=true'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  ENABLE_MAP: z.coerce.boolean().default(false),
});

function parseEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    // Use process.stderr directly so pino is not required here
    process.stderr.write(
      `[config] Invalid environment variables:\n${JSON.stringify(result.error.format(), null, 2)}\n`,
    );
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
