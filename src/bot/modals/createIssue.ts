import { ModalSubmitInteraction } from 'discord.js';
import { db } from '../../db/index.js';
import { guilds, users, issues } from '../../db/schema.js';
import { decrypt } from '../../services/encryption.js';
import { createIssue } from '../../services/github.js';
import { issueCreatedEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { eq, and } from 'drizzle-orm';

export async function handleCreateIssueModal(interaction: ModalSubmitInteraction) {
  await interaction.deferReply();

  const guildId = interaction.guildId!;
  const discordUserId = interaction.user.id;
  const discordUsername = interaction.user.username;

  const title = interaction.fields.getTextInputValue('issue-title');
  const description = interaction.fields.getTextInputValue('issue-description');
  const labelsRaw = interaction.fields.getTextInputValue('issue-labels');
  const labels = labelsRaw ? labelsRaw.split(',').map(l => l.trim()).filter(Boolean) : [];

  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo || !guildConfig?.githubTokenEncrypted) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured for this server.')] });
    return;
  }

  const [user] = await db.select().from(users).where(
    and(eq(users.discordUserId, discordUserId), eq(users.guildId, guildId))
  );

  const githubUsername = user?.githubUsername;
  const attribution = githubUsername
    ? `Reported by [@${githubUsername}](https://github.com/${githubUsername}) via Discord (${discordUsername})`
    : `Reported via Discord by ${discordUsername}`;

  const body = `${description}\n\n---\n*${attribution}*`;

  try {
    const token = decrypt(guildConfig.githubTokenEncrypted);
    const issue = await createIssue({
      token,
      owner: guildConfig.githubOwner,
      repo: guildConfig.githubRepo,
      title,
      body,
      labels,
    });

    const createdBy = githubUsername ? `@${githubUsername} (${discordUsername})` : discordUsername;
    const embed = issueCreatedEmbed(issue, createdBy);
    const reply = await interaction.editReply({ embeds: [embed] });

    await db.insert(issues).values({
      guildId,
      discordUserId,
      discordMessageId: reply.id,
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.html_url,
      title: issue.title,
    });

    logger.info({ guildId, issueNumber: issue.number, user: discordUsername }, 'Issue created');
  } catch (err) {
    logger.error({ err, guildId }, 'Failed to create issue');
    await interaction.editReply({ embeds: [errorEmbed('Failed to create the issue. Check the bot\'s GitHub token permissions.')] });
  }
}
