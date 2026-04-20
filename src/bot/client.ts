import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config.js';
import { registerCommands } from './commands/index.js';
import { handleReady } from './events/ready.js';
import { handleInteractionCreate } from './events/interactionCreate.js';
import { handleGuildDelete } from './events/guildDelete.js';

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

export async function startBot() {
  await registerCommands();

  client.once('ready', handleReady);
  client.on('interactionCreate', handleInteractionCreate);
  client.on('guildDelete', handleGuildDelete);

  await client.login(config.discordToken);
}
