import cron from 'node-cron';
import { FirmsIngestionService } from '../services/firmsIngestionService';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function initializeScheduler(): void {
  const cronExpression = env.INGESTION_CRON || '*/15 * * * *';

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression for data ingestion: ${cronExpression}`);
    return;
  }

  logger.info(`Initializing background scheduler: Ingestion job scheduled with cron '${cronExpression}'`);

  cron.schedule(cronExpression, async () => {
    logger.info('Running scheduled NASA FIRMS data ingestion task...');
    try {
      await FirmsIngestionService.executeSyncJob();
      logger.info('Scheduled NASA FIRMS ingestion completed successfully.');
    } catch (err) {
      logger.error(`Error in scheduled ingestion job: ${err}`);
    }
  });
}

