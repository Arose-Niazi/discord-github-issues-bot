import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../../db/index.js';
import { guilds } from '../../db/schema.js';
import { notifyIssueClosed } from '../../services/notifications.js';
import { logger } from '../../utils/logger.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.post('/webhooks/github/:guildId', async (req: Request<{ guildId: string }>, res: Response) => {
  const guildId = req.params.guildId;
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string | undefined;

  if (!signature || !event) {
    res.status(400).json({ error: 'Missing headers' });
    return;
  }

  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  if (!guildConfig?.webhookSecret) {
    res.status(404).json({ error: 'Guild not found' });
    return;
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    res.status(400).json({ error: 'Missing body' });
    return;
  }

  const expected = 'sha256=' + crypto.createHmac('sha256', guildConfig.webhookSecret).update(rawBody).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  if (event === 'issues' && req.body.action === 'closed') {
    const issue = req.body.issue;
    const closedBy = req.body.sender?.login ?? 'Unknown';
    logger.info({ guildId, issueNumber: issue.number }, 'Received issue closed event');
    notifyIssueClosed(guildId, issue, closedBy).catch(err => {
      logger.error({ err, guildId }, 'Notification failed');
    });
  }

  res.status(200).json({ ok: true });
});

export default router;
