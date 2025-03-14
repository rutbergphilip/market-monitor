import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
dotenv.config();

import { CronJob } from 'cron';

import { blocketJob } from '@/integrations/cron/blocket-job';

const job = CronJob.from({
  cronTime: process.env.AD_CRON_TIME || '*/5 * * * *',
  onTick: blocketJob,
  start: true,
  timeZone: process.env.BLOCKET_TIMEZONE || 'Europe/Stockholm',
  runOnInit: true,
});

job.start();
