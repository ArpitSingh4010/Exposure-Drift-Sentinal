/**
 * dev-mongo.ts
 * Starts an in-process MongoMemoryReplSet (mongodb-memory-server 7.x),
 * then boots the Express server — no external mongod required.
 *
 * Usage: tsx src/dev-mongo.ts
 * This is ONLY for local development without Docker/mongod.
 * Production always uses a real MongoDB replica set.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import mongoose from 'mongoose';
import { ensureIndexes } from './seed/index.js';
import { loadAndStoreRules } from './config/rulesLoader.js';

async function main(): Promise<void> {
  logger.info('Starting embedded MongoMemoryReplSet for local dev...');

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    instanceOpts: [{ port: 27017 }],
  });

  const uri = replSet.getUri('eds');
  logger.info({ uri }, 'MongoMemoryReplSet ready');

  // Connect Mongoose
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info('Mongoose connected to embedded replica set');
  await ensureIndexes();
  await loadAndStoreRules();

  // Start Express
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT },
      'Exposure Drift Sentinel (dev-local) listening — Mongo is in-process',
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'shutdown');
    server.close();
    await mongoose.connection.close();
    await replSet.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.error({ err }, 'fatal dev-local startup error');
  process.exit(1);
});
