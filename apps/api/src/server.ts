import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';
import { authService } from './services/auth.service';
import { Policy, POLICY_CATEGORIES } from './models/Policy';
import { env } from './config/env';
import { logger } from './utils/logger';

async function seedPolicies(): Promise<void> {
  const count = await Policy.countDocuments();
  if (count >= POLICY_CATEGORIES.length) return;

  const ops = POLICY_CATEGORIES.map((category) => ({
    updateOne: {
      filter: { category },
      update: {
        $setOnInsert: {
          category,
          enabled: true,
          confidenceThreshold: 75,
          enforcement: 'flag_for_review' as const,
        },
      },
      upsert: true,
    },
  }));

  await Policy.bulkWrite(ops);
  logger.info(`✅ Seeded ${POLICY_CATEGORIES.length} default policy categories`);
}

async function main() {
  try {
    await connectDatabase().catch((e) => {
      logger.error('Failed to connect to MongoDB. API will return errors.', e);
    });

    // Seed default data
    await authService.seedAdmin().catch(e => logger.error('Seed error:', e));
    await seedPolicies().catch(e => logger.error('Seed policies error:', e));

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 API server running on http://localhost:${env.PORT}/api/v1`);
      logger.info(`📦 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.warn(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal error during startup:', error);
  }
}

main();
