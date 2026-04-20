import { ChatInputCommandInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { db } from '../../db/index.js';
import { guilds } from '../../db/schema.js';
import { errorEmbed } from '../../utils/embeds.js';
import { eq } from 'drizzle-orm';

export async function handleIssue(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;
  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));

  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo || !guildConfig?.githubTokenEncrypted) {
    await interaction.reply({ embeds: [errorEmbed('BugSnitch is not configured yet. An admin needs to run `/setup github` first.')], ephemeral: true });
    return;
  }

  if (guildConfig.issuesChannelId && interaction.channelId !== guildConfig.issuesChannelId) {
    await interaction.reply({ embeds: [errorEmbed(`Issues can only be created in <#${guildConfig.issuesChannelId}>`)], ephemeral: true });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId('create-issue')
    .setTitle('Create GitHub Issue');

  const titleInput = new TextInputBuilder()
    .setCustomId('issue-title')
    .setLabel('Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Brief description of the issue')
    .setMaxLength(256)
    .setRequired(true);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('issue-description')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Detailed description. Supports markdown, code blocks, and image URLs.')
    .setMaxLength(4000)
    .setRequired(true);

  const labelsInput = new TextInputBuilder()
    .setCustomId('issue-labels')
    .setLabel('Labels (comma-separated, optional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('bug, enhancement, ui')
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(labelsInput),
  );

  await interaction.showModal(modal);
}
