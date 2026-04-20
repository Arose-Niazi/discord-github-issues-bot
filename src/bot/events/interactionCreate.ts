import { Interaction } from 'discord.js';
import { handleSetup } from '../commands/setup.js';
import { handleIssue } from '../commands/issue.js';
import { handleIssues } from '../commands/issues.js';
import { handleGithub } from '../commands/github.js';
import { handleCreateIssueModal } from '../modals/createIssue.js';
import { logger } from '../../utils/logger.js';

export async function handleInteractionCreate(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case 'setup': return await handleSetup(interaction);
        case 'issue': return await handleIssue(interaction);
        case 'issues': return await handleIssues(interaction);
        case 'github': return await handleGithub(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      switch (interaction.customId) {
        case 'create-issue': return await handleCreateIssueModal(interaction);
      }
    }
  } catch (err) {
    logger.error({ err, command: interaction.isCommand() ? interaction.commandName : 'modal' }, 'Interaction handler error');

    const reply = interaction.isRepliable()
      ? interaction.deferred
        ? interaction.editReply({ content: 'Something went wrong.' })
        : interaction.reply({ content: 'Something went wrong.', ephemeral: true })
      : undefined;

    await reply;
  }
}
