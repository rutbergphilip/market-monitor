import { CronJob } from 'cron';
import { RefreshTokenRepository } from '@/db/repositories';
import logger from '@/integrations/logger';

/**
 * Cron job that runs daily at 1:00 AM to clean up expired and revoked refresh tokens
 */
export const refreshTokenCleanupJob = new CronJob(
  '0 1 * * *', // Run at 1:00 AM every day
  async function () {
    try {
      logger.info({
        message: 'Starting refresh token cleanup job',
      });

      const tokensRemoved = RefreshTokenRepository.cleanupTokens();

      logger.info({
        message: 'Completed refresh token cleanup job',
        tokensRemoved,
      });
    } catch (error) {
      logger.error({
        message: 'Error in refresh token cleanup job',
        error,
      });
    }
  },
  null, // onComplete
  false, // start automatically
  'UTC', // timezone
);
