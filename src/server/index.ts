import express from 'express';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import healthRouter from './routes/health.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(express.json({
  verify: (req, _res, buf) => {
    (req as typeof req & { rawBody?: Buffer }).rawBody = buf;
  },
}));

app.use(healthRouter);
app.use(webhookRouter);

export function startServer(): Promise<void> {
  return new Promise((resolve) => {
    app.listen(config.port, () => {
      logger.info({ port: config.port }, 'Webhook server listening');
      resolve();
    });
  });
}
