import 'tsconfig-paths/register';
import { CronJob } from 'cron';
import { createServer } from 'http';

import * as dotenv from 'dotenv';
dotenv.config();

import { blocketJob } from '@/integrations/cron/blocket-job';
import { healthCheckHandler, testDiscordHandler } from './routes';

if (!process.env.BLOCKET_AD_QUERY) {
  console.error('Environment variable BLOCKET_AD_QUERY is not set. Exiting...');
  process.exit(1);
}

/**
 * A simple HTTP server for health checks and testing
 * - Health check endpoint: /health
 * - Test Discord notification endpoint: /test-discord
 *   - Method: POST
 *   - Body: JSON with ads to send
 */
const server = createServer((req, res) => {
  if (req.url === '/health') {
    healthCheckHandler(req, res);
  } else if (req.url === '/test-discord' && req.method === 'POST') {
    testDiscordHandler(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

const job = CronJob.from({
  cronTime: process.env.BLOCKET_CRON_TIME || '*/5 * * * *',
  onTick: blocketJob,
  start: true,
  timeZone: process.env.BLOCKET_TIMEZONE || 'Europe/Stockholm',
  runOnInit: process.env.BLOCKET_RUN_ON_INIT !== 'false',
});

job.start();

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down...');
  job.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
