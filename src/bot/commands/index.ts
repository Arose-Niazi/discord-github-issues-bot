import { REST, Routes, SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure BugSnitch for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('github')
        .setDescription('Connect a GitHub repository')
        .addStringOption(opt => opt.setName('owner').setDescription('Repository owner (user or org)').setRequired(true))
        .addStringOption(opt => opt.setName('repo').setDescription('Repository name').setRequired(true))
        .addStringOption(opt => opt.setName('token').setDescription('GitHub personal access token').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('channel')
        .setDescription('Set the channel for issue creation')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel for issues').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('webhook-channel')
        .setDescription('Set the channel for closure notifications')
        .addChannelOption(opt => opt.setName('channel').setDescription('Channel for notifications').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Show current BugSnitch configuration')
    ),

  new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Create a new GitHub issue'),

  new SlashCommandBuilder()
    .setName('issues')
    .setDescription('View GitHub issues')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List recent open issues')
    )
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Search issues by title')
        .addStringOption(opt => opt.setName('query').setDescription('Search query').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Check status of a specific issue')
        .addIntegerOption(opt => opt.setName('number').setDescription('Issue number').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('mine')
        .setDescription('Show issues you created')
    ),

  new SlashCommandBuilder()
    .setName('github')
    .setDescription('Link your GitHub account')
    .addSubcommand(sub =>
      sub.setName('link')
        .setDescription('Link your GitHub username')
        .addStringOption(opt => opt.setName('username').setDescription('Your GitHub username').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('unlink')
        .setDescription('Remove your GitHub username link')
    ),
];

export async function registerCommands() {
  const rest = new REST().setToken(config.discordToken);

  logger.info('Registering slash commands...');
  await rest.put(
    Routes.applicationCommands(config.discordClientId),
    { body: commands.map(c => c.toJSON()) },
  );
  logger.info(`Registered ${commands.length} commands`);
}
