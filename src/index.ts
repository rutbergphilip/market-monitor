import * as dotenv from 'dotenv';
import http from 'http';
dotenv.config();

import { CronJob } from 'cron';
import { blocketJob } from '@/integrations/cron/blocket-job';

if (!process.env.BLOCKET_AD_QUERY) {
  console.error('Environment variable BLOCKET_AD_QUERY is not set. Exiting...');
  process.exit(1);
}

/**
 * Create a simple HTTP server for health checks
 * This allows Docker and Kubernetes to determine if the container is healthy
 */
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Simple health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Use environment variable for port or default to 8080
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Set up blocket job with cron schedule from environment variables
const job = CronJob.from({
  cronTime: process.env.BLOCKET_CRON_TIME || '*/5 * * * *',
  onTick: blocketJob,
  start: true,
  timeZone: process.env.BLOCKET_TIMEZONE || 'Europe/Stockholm',
  runOnInit: process.env.BLOCKET_RUN_ON_INIT !== 'false',
});

job.start();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down...');
  job.stop();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
