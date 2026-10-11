import mongoose from 'mongoose';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { ensureIndexes, seedDb } from './seed/index.js';
import { loadAndStoreRules } from './config/rulesLoader.js';
import { Policy } from './models/Policy.js';

async function main(): Promise<void> {
  // ── Connect to MongoDB ────────────────────────────────────────────────────
  logger.info({ uri: env.MONGO_URI }, 'connecting to MongoDB');
  await mongoose.connect(env.MONGO_URI, {
    // serverSelectionTimeoutMS helps fail-fast in tests / CI
    serverSelectionTimeoutMS: 10_000,
  });
  logger.info('MongoDB connected');
  await ensureIndexes();
  await loadAndStoreRules();
  const policyCount = await Policy.countDocuments();
  if (policyCount === 0) {
    logger.info('Database empty — running initial deterministic seed');
    await seedDb();
  }
  logger.info('Indexes, active rules, and data ready');

  // ── Start HTTP server ────────────────────────────────────────────────────
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Exposure Drift Sentinel server listening');
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'shutdown signal received');
    server.close(() => {
      mongoose.connection
        .close()
        .then(() => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        })
        .catch((err: unknown) => {
          logger.error({ err }, 'error closing MongoDB connection');
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.error({ err }, 'fatal startup error');
  process.exit(1);
});
