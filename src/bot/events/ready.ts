import { Client } from 'discord.js';
import { logger } from '../../utils/logger.js';

export function handleReady(client: Client<true>) {
  logger.info(`Logged in as ${client.user.tag} (${client.guilds.cache.size} guilds)`);
  client.user.setActivity('Snitching bugs');
}
