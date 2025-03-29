import 'tsconfig-paths/register';

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import routes from './routes';
import logger from './integrations/logger';
import { initializeDb } from './db';

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

// Cors
app.use(cors());

// Register all routes
app.use(routes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).end();
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const server = app.listen(PORT, () => {
  logger.info(`Express server running on port ${PORT}`);

  initializeDb();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received, shutting down...');
  server.close(() => {
    logger.info('Express server closed');
    process.exit(0);
  });
});
