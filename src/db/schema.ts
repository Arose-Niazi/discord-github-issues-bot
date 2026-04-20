import { pgTable, serial, varchar, text, integer, timestamp, unique } from 'drizzle-orm/pg-core';

export const guilds = pgTable('guilds', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull().unique(),
  githubOwner: varchar('github_owner', { length: 255 }),
  githubRepo: varchar('github_repo', { length: 255 }),
  githubTokenEncrypted: text('github_token_encrypted'),
  issuesChannelId: varchar('issues_channel_id', { length: 20 }),
  notificationChannelId: varchar('notification_channel_id', { length: 20 }),
  webhookSecret: varchar('webhook_secret', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discordUserId: varchar('discord_user_id', { length: 20 }).notNull(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  githubUsername: varchar('github_username', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('users_discord_guild_unique').on(table.discordUserId, table.guildId),
]);

export const issues = pgTable('issues', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  discordUserId: varchar('discord_user_id', { length: 20 }).notNull(),
  discordMessageId: varchar('discord_message_id', { length: 20 }),
  githubIssueNumber: integer('github_issue_number').notNull(),
  githubIssueUrl: varchar('github_issue_url', { length: 500 }).notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  closedAt: timestamp('closed_at'),
});
