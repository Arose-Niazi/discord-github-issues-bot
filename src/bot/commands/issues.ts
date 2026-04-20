import { ChatInputCommandInteraction } from 'discord.js';
import { db } from '../../db/index.js';
import { guilds, issues } from '../../db/schema.js';
import { decrypt } from '../../services/encryption.js';
import * as github from '../../services/github.js';
import { issueStatusEmbed, issueListEmbed, errorEmbed } from '../../utils/embeds.js';
import { eq, and, desc } from 'drizzle-orm';

async function getGuildConfig(guildId: string) {
  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  return guildConfig;
}

export async function handleIssues(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'list': return handleList(interaction);
    case 'search': return handleSearch(interaction);
    case 'status': return handleStatus(interaction);
    case 'mine': return handleMine(interaction);
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildConfig = await getGuildConfig(interaction.guildId!);
  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo || !guildConfig?.githubTokenEncrypted) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured yet.')] });
    return;
  }

  try {
    const token = decrypt(guildConfig.githubTokenEncrypted);
    const issuesList = await github.listIssues(token, guildConfig.githubOwner, guildConfig.githubRepo);
    const embed = issueListEmbed(issuesList, 'Recent Open Issues');
    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({ embeds: [errorEmbed('Failed to fetch issues from GitHub.')] });
  }
}

async function handleSearch(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const query = interaction.options.getString('query', true);
  const guildConfig = await getGuildConfig(interaction.guildId!);
  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo || !guildConfig?.githubTokenEncrypted) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured yet.')] });
    return;
  }

  try {
    const token = decrypt(guildConfig.githubTokenEncrypted);
    const results = await github.searchIssues(token, guildConfig.githubOwner, guildConfig.githubRepo, query);
    const embed = issueListEmbed(results, `Search: "${query}"`);
    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({ embeds: [errorEmbed('Failed to search issues.')] });
  }
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const issueNumber = interaction.options.getInteger('number', true);
  const guildConfig = await getGuildConfig(interaction.guildId!);
  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo || !guildConfig?.githubTokenEncrypted) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured yet.')] });
    return;
  }

  try {
    const token = decrypt(guildConfig.githubTokenEncrypted);
    const issue = await github.getIssue(token, guildConfig.githubOwner, guildConfig.githubRepo, issueNumber);
    const embed = issueStatusEmbed(issue);
    await interaction.editReply({ embeds: [embed] });
  } catch {
    await interaction.editReply({ embeds: [errorEmbed(`Issue #${issueNumber} not found.`)] });
  }
}

async function handleMine(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const discordUserId = interaction.user.id;

  const guildConfig = await getGuildConfig(guildId);
  if (!guildConfig?.githubOwner || !guildConfig?.githubRepo) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured yet.')] });
    return;
  }

  const myIssues = await db.select().from(issues)
    .where(and(eq(issues.guildId, guildId), eq(issues.discordUserId, discordUserId)))
    .orderBy(desc(issues.createdAt))
    .limit(15);

  if (myIssues.length === 0) {
    await interaction.editReply({ embeds: [errorEmbed("You haven't created any issues yet.")] });
    return;
  }

  const formatted = myIssues.map(i => ({
    number: i.githubIssueNumber,
    title: i.title,
    html_url: i.githubIssueUrl,
    state: i.status,
    body: null,
    labels: [],
    user: null,
    assignees: null,
    comments: 0,
    created_at: i.createdAt.toISOString(),
    closed_at: i.closedAt?.toISOString() ?? null,
  }));

  const embed = issueListEmbed(formatted, 'Your Issues');
  await interaction.editReply({ embeds: [embed] });
}
