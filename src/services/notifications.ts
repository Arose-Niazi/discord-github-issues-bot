import { client } from '../bot/client.js';
import { db } from '../db/index.js';
import { guilds, issues } from '../db/schema.js';
import { issueClosedEmbed } from '../utils/embeds.js';
import { logger } from '../utils/logger.js';
import { eq, and } from 'drizzle-orm';
import type { GitHubIssue } from './github.js';

export async function notifyIssueClosed(guildId: string, githubIssue: GitHubIssue) {
  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  if (!guildConfig) return;

  const channelId = guildConfig.notificationChannelId || guildConfig.issuesChannelId;
  if (!channelId) return;

  const [trackedIssue] = await db.select().from(issues).where(
    and(eq(issues.guildId, guildId), eq(issues.githubIssueNumber, githubIssue.number))
  );
  if (!trackedIssue) return;

  await db.update(issues)
    .set({ status: 'closed', closedAt: new Date(), updatedAt: new Date() })
    .where(eq(issues.id, trackedIssue.id));

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !('send' in channel)) return;

    const closedBy = githubIssue.closed_by?.login ?? 'Unknown';
    const embed = issueClosedEmbed(githubIssue, trackedIssue.discordUserId, closedBy);

    await channel.send({
      content: `<@${trackedIssue.discordUserId}> your issue was closed:`,
      embeds: [embed],
    });

    logger.info({ guildId, issueNumber: githubIssue.number }, 'Closure notification sent');
  } catch (err) {
    logger.error({ err, guildId, channelId }, 'Failed to send closure notification');
  }
}
