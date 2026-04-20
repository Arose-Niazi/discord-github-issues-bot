import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import crypto from 'node:crypto';
import { db } from '../../db/index.js';
import { guilds } from '../../db/schema.js';
import { encrypt } from '../../services/encryption.js';
import { verifyToken } from '../../services/github.js';
import { config } from '../../config.js';
import { setupGuideEmbed, setupStatusEmbed, errorEmbed } from '../../utils/embeds.js';
import { eq } from 'drizzle-orm';

function requireAdmin(interaction: ChatInputCommandInteraction): boolean {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    interaction.reply({ embeds: [errorEmbed('You need **Manage Server** permission to use this command.')], ephemeral: true });
    return false;
  }
  return true;
}

export async function handleSetup(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'github': return handleGithub(interaction);
    case 'channel': return handleChannel(interaction);
    case 'webhook-channel': return handleWebhookChannel(interaction);
    case 'status': return handleStatus(interaction);
  }
}

async function handleGithub(interaction: ChatInputCommandInteraction) {
  if (!requireAdmin(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const owner = interaction.options.getString('owner', true);
  const repo = interaction.options.getString('repo', true);
  const token = interaction.options.getString('token', true);

  const valid = await verifyToken(token, owner, repo);
  if (!valid) {
    await interaction.editReply({ embeds: [errorEmbed('Could not access that repository. Check the owner, repo name, and token permissions.')] });
    return;
  }

  const encryptedToken = encrypt(token);
  const webhookSecret = crypto.randomBytes(32).toString('hex');
  const guildId = interaction.guildId!;

  await db.insert(guilds)
    .values({
      guildId,
      githubOwner: owner,
      githubRepo: repo,
      githubTokenEncrypted: encryptedToken,
      webhookSecret,
    })
    .onConflictDoUpdate({
      target: guilds.guildId,
      set: {
        githubOwner: owner,
        githubRepo: repo,
        githubTokenEncrypted: encryptedToken,
        webhookSecret,
        updatedAt: new Date(),
      },
    });

  const webhookUrl = `${config.webhookBaseUrl}/webhooks/github/${guildId}`;
  const embeds = setupGuideEmbed(owner, repo, webhookUrl, webhookSecret);
  await interaction.editReply({ embeds });
}

async function handleChannel(interaction: ChatInputCommandInteraction) {
  if (!requireAdmin(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('channel', true);
  const guildId = interaction.guildId!;

  const [existing] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  if (!existing) {
    await interaction.editReply({ embeds: [errorEmbed('Run `/setup github` first to connect a repository.')] });
    return;
  }

  await db.update(guilds)
    .set({ issuesChannelId: channel.id, updatedAt: new Date() })
    .where(eq(guilds.guildId, guildId));

  await interaction.editReply({ content: `Issues channel set to <#${channel.id}>` });
}

async function handleWebhookChannel(interaction: ChatInputCommandInteraction) {
  if (!requireAdmin(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.options.getChannel('channel', true);
  const guildId = interaction.guildId!;

  const [existing] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));
  if (!existing) {
    await interaction.editReply({ embeds: [errorEmbed('Run `/setup github` first to connect a repository.')] });
    return;
  }

  await db.update(guilds)
    .set({ notificationChannelId: channel.id, updatedAt: new Date() })
    .where(eq(guilds.guildId, guildId));

  await interaction.editReply({ content: `Notification channel set to <#${channel.id}>` });
}

async function handleStatus(interaction: ChatInputCommandInteraction) {
  if (!requireAdmin(interaction)) return;
  await interaction.deferReply({ ephemeral: true });

  const guildId = interaction.guildId!;
  const [guildConfig] = await db.select().from(guilds).where(eq(guilds.guildId, guildId));

  if (!guildConfig) {
    await interaction.editReply({ embeds: [errorEmbed('BugSnitch is not configured yet. Run `/setup github` to get started.')] });
    return;
  }

  const embed = setupStatusEmbed(guildConfig, config.webhookBaseUrl, guildId);
  await interaction.editReply({ embeds: [embed] });
}
