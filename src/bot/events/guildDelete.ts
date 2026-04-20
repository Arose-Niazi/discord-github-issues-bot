import { Guild } from 'discord.js';
import { db } from '../../db/index.js';
import { guilds } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';

export async function handleGuildDelete(guild: Guild) {
  logger.info({ guildId: guild.id, name: guild.name }, 'Removed from guild, cleaning up');
  await db.delete(guilds).where(eq(guilds.guildId, guild.id));
}
