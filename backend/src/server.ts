import 'dotenv/config';
import app from './app';
import config from './config/env';
import prisma from './config/prisma';
import logger from './utils/logger';

const PORT = config.PORT || 4000;

async function main() {
  try {
    // Test database connection with retry
    let retries = 10;
    while (retries > 0) {
      try {
        await prisma.$connect();
        logger.info('✅ Database connected');
        break;
      } catch (err) {
        retries -= 1;
        if (retries === 0) throw err;
        logger.warn(`Waiting for database... Retrying in 1s (${retries} attempts left)`);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Nivasa API running on http://localhost:${PORT}`);
      logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health: http://localhost:${PORT}/api/health`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
