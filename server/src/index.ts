import 'tsconfig-paths/register';

import express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

import routes from './routes';

import { initializeDb } from './db';

if (!process.env.BLOCKET_AD_QUERIES) {
  console.error(
    'Environment variable BLOCKET_AD_QUERIES is not set. Exiting...',
  );
  process.exit(1);
}

/**
 * Express server for health checks and testing
 * - Health check endpoint: /health
 * - Test Discord notification endpoint: /test-discord
 *   - Method: POST
 *   - Body: JSON with ads to send
 */
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Register all routes
app.use(routes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).end();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const server = app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);

  initializeDb();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down...');
  server.close(() => {
    console.log('Express server closed');
    process.exit(0);
  });
});
