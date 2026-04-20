import { EmbedBuilder } from 'discord.js';
import type { GitHubIssue } from '../services/github.js';

const COLORS = {
  open: 0x238636,
  closed: 0x8957e5,
  info: 0x58a6ff,
  error: 0xda3633,
  setup: 0xf0883e,
} as const;

export function issueCreatedEmbed(issue: GitHubIssue, createdBy: string): EmbedBuilder {
  const labels = issue.labels.map(l => `\`${l.name}\``).join(' ') || 'None';
  const description = issue.body
    ? issue.body.length > 200 ? issue.body.slice(0, 200) + '...' : issue.body
    : 'No description';

  return new EmbedBuilder()
    .setColor(COLORS.open)
    .setTitle(`#${issue.number}: ${issue.title}`)
    .setURL(issue.html_url)
    .setDescription(description)
    .addFields(
      { name: 'Labels', value: labels, inline: true },
      { name: 'Created by', value: createdBy, inline: true },
    )
    .setTimestamp();
}

export function issueClosedEmbed(issue: GitHubIssue, discordUserId: string, closedBy: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.closed)
    .setTitle(`Issue #${issue.number} Closed: ${issue.title}`)
    .setURL(issue.html_url)
    .addFields(
      { name: 'Closed by', value: closedBy, inline: true },
      { name: 'Reported by', value: `<@${discordUserId}>`, inline: true },
    )
    .setTimestamp();
}

export function issueStatusEmbed(issue: GitHubIssue): EmbedBuilder {
  const color = issue.state === 'open' ? COLORS.open : COLORS.closed;
  const description = issue.body
    ? issue.body.length > 500 ? issue.body.slice(0, 500) + '...' : issue.body
    : 'No description';

  const fields = [
    { name: 'Status', value: issue.state, inline: true },
    { name: 'Comments', value: String(issue.comments), inline: true },
    { name: 'Labels', value: issue.labels.map(l => `\`${l.name}\``).join(' ') || 'None', inline: true },
  ];

  if (issue.assignees?.length) {
    fields.push({ name: 'Assignees', value: issue.assignees.map(a => a.login).join(', '), inline: true });
  }

  if (issue.closed_at) {
    fields.push({ name: 'Closed at', value: new Date(issue.closed_at).toLocaleDateString(), inline: true });
  }

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`#${issue.number}: ${issue.title}`)
    .setURL(issue.html_url)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: `Created ${new Date(issue.created_at).toLocaleDateString()}` });
}

export function issueListEmbed(issues: GitHubIssue[], title: string): EmbedBuilder {
  if (issues.length === 0) {
    return new EmbedBuilder()
      .setColor(COLORS.info)
      .setTitle(title)
      .setDescription('No issues found.');
  }

  const lines = issues.map(i => {
    const status = i.state === 'open' ? '🟢' : '🟣';
    return `${status} **[#${i.number}](${i.html_url})** ${i.title}`;
  });

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(lines.join('\n'));
}

export function setupGuideEmbed(owner: string, repo: string, webhookUrl: string, webhookSecret: string): EmbedBuilder[] {
  const confirmed = new EmbedBuilder()
    .setColor(COLORS.open)
    .setTitle('GitHub Repository Connected')
    .setDescription(`Successfully connected to **${owner}/${repo}**`)
    .setTimestamp();

  const webhookGuide = new EmbedBuilder()
    .setColor(COLORS.setup)
    .setTitle('Webhook Setup Instructions')
    .setDescription(
      `To receive issue closure notifications, set up a GitHub webhook:\n\n` +
      `**1.** Go to your repo settings:\n` +
      `\`https://github.com/${owner}/${repo}/settings/hooks/new\`\n\n` +
      `**2.** Fill in:\n` +
      `> **Payload URL:** \`${webhookUrl}\`\n` +
      `> **Content type:** \`application/json\`\n` +
      `> **Secret:** \`${webhookSecret}\`\n\n` +
      `**3.** Under "Which events?", select **"Let me select individual events"** and check only **"Issues"**\n\n` +
      `**4.** Click **"Add webhook"**`
    );

  const nextSteps = new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('Next Steps')
    .setDescription(
      `- Run \`/setup channel #channel\` to set where issues are created\n` +
      `- Run \`/setup webhook-channel #channel\` (optional) for closure notifications in a different channel\n` +
      `- Run \`/setup status\` anytime to check your configuration`
    );

  return [confirmed, webhookGuide, nextSteps];
}

export function setupStatusEmbed(guildConfig: {
  githubOwner: string | null;
  githubRepo: string | null;
  issuesChannelId: string | null;
  notificationChannelId: string | null;
  webhookSecret: string | null;
}, webhookBaseUrl: string, guildId: string): EmbedBuilder {
  const check = (v: unknown) => v ? '✅' : '❌';

  const fields = [
    { name: 'GitHub Repo', value: guildConfig.githubOwner && guildConfig.githubRepo ? `${check(true)} ${guildConfig.githubOwner}/${guildConfig.githubRepo}` : `${check(false)} Not configured`, inline: false },
    { name: 'GitHub Token', value: `${check(guildConfig.githubOwner)} ${guildConfig.githubOwner ? 'Set (encrypted)' : 'Not set'}`, inline: false },
    { name: 'Issues Channel', value: guildConfig.issuesChannelId ? `${check(true)} <#${guildConfig.issuesChannelId}>` : `${check(false)} Not set — run \`/setup channel\``, inline: false },
    { name: 'Notification Channel', value: guildConfig.notificationChannelId ? `${check(true)} <#${guildConfig.notificationChannelId}>` : `ℹ️ Using issues channel (default)`, inline: false },
    { name: 'Webhook URL', value: `\`${webhookBaseUrl}/webhooks/github/${guildId}\``, inline: false },
  ];

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle('BugSnitch Configuration')
    .addFields(fields);
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setDescription(message);
}
