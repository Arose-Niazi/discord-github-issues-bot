CREATE TABLE "guilds" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"github_owner" varchar(255),
	"github_repo" varchar(255),
	"github_token_encrypted" text,
	"issues_channel_id" varchar(20),
	"notification_channel_id" varchar(20),
	"webhook_secret" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "guilds_guild_id_unique" UNIQUE("guild_id")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"discord_user_id" varchar(20) NOT NULL,
	"discord_message_id" varchar(20),
	"github_issue_number" integer NOT NULL,
	"github_issue_url" varchar(500) NOT NULL,
	"title" varchar(256) NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"discord_user_id" varchar(20) NOT NULL,
	"guild_id" varchar(20) NOT NULL,
	"github_username" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_discord_guild_unique" UNIQUE("discord_user_id","guild_id")
);
