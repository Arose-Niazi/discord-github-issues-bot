import { ChatInputCommandInteraction } from 'discord.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function handleGithub(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'link': return handleLink(interaction);
    case 'unlink': return handleUnlink(interaction);
  }
}

async function handleLink(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.options.getString('username', true);
  const discordUserId = interaction.user.id;
  const guildId = interaction.guildId!;

  await db.insert(users)
    .values({ discordUserId, guildId, githubUsername: username })
    .onConflictDoUpdate({
      target: [users.discordUserId, users.guildId],
      set: { githubUsername: username, updatedAt: new Date() },
    });

  await interaction.editReply({ content: `Linked your account to GitHub user **${username}**` });
}

async function handleUnlink(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const discordUserId = interaction.user.id;
  const guildId = interaction.guildId!;

  await db.update(users)
    .set({ githubUsername: null, updatedAt: new Date() })
    .where(and(eq(users.discordUserId, discordUserId), eq(users.guildId, guildId)));

  await interaction.editReply({ content: 'GitHub username unlinked.' });
}
