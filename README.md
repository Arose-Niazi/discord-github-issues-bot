# BugSnitch

**BugSnitch** is a Discord bot that lets your community report bugs and request features directly to GitHub — without ever leaving Discord. Connect a repo, set a channel, and your team can create fully-formatted GitHub issues with descriptions, code blocks, labels, and image links right from a Discord modal.

[**Add BugSnitch to your server**](https://discord.com/oauth2/authorize?client_id=1495854456162619442&permissions=2147485696&scope=bot%20applications.commands)

---

## Features

- **Create GitHub Issues from Discord** — Users fill out a clean modal with title, description, and labels. Issues are created instantly on your linked GitHub repo.
- **Issue Closure Notifications** — When someone closes an issue on GitHub, BugSnitch pings the original reporter in Discord with a notification embed.
- **Search & Track Issues** — Search issues by title, list recent open issues, check the status of any issue by number, or view all issues you've personally created.
- **GitHub Username Linking** — Users can link their GitHub username so issues are attributed with their profile on GitHub.
- **Multi-Server Support** — Any server can invite BugSnitch. Each server connects its own repo with its own token and channel configuration. Fully isolated.
- **Admin-Only Setup** — Only server administrators can configure the bot. Setup commands are hidden from regular users.
- **Encrypted Token Storage** — GitHub tokens are encrypted with AES-256-GCM at rest in the database. Never stored in plaintext.
- **Guided Setup** — The bot walks admins through every step including GitHub webhook configuration with exact URLs, secrets, and instructions.

---

## Commands

| Command | Who Can Use | Description |
|---------|-------------|-------------|
| `/setup github` | Admin | Connect a GitHub repository (owner, repo, token) |
| `/setup channel` | Admin | Set the channel where issues are created |
| `/setup webhook-channel` | Admin | Set a separate channel for closure notifications |
| `/setup status` | Admin | View current configuration and what's missing |
| `/issue` | Everyone | Open a modal to create a new GitHub issue |
| `/issues list` | Everyone | Show the 10 most recent open issues |
| `/issues search <query>` | Everyone | Search issues by partial title match |
| `/issues status <number>` | Everyone | View full details of a specific issue |
| `/issues mine` | Everyone | Show all issues you've created and their status |
| `/github link <username>` | Everyone | Link your Discord account to your GitHub username |
| `/github unlink` | Everyone | Remove your GitHub link |

---

## Quick Start

### 1. Invite the Bot

[Click here to add BugSnitch to your server](https://discord.com/oauth2/authorize?client_id=1495854456162619442&permissions=2147485696&scope=bot%20applications.commands)

The bot requires these permissions:
- **Send Messages** — to post issue embeds and notifications
- **Embed Links** — to display rich issue cards
- **Use Application Commands** — for slash commands

### 2. Create a GitHub Token

1. Go to [GitHub Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Give it a name (e.g. `BugSnitch`)
3. Set **Repository access** to "Only select repositories" and pick your target repo
4. Under **Permissions**, set **Issues** to **Read and Write**
5. Click **Generate token** and copy it

### 3. Connect Your Repo

In your Discord server, run:

```
/setup github owner:YourGitHubUsername repo:your-repo-name token:ghp_your_token_here
```

The bot will:
- Verify the token has access to the repo
- Store the token encrypted in the database
- Reply with step-by-step webhook setup instructions

### 4. Set the Issues Channel

```
/setup channel #bugs
```

Now anyone in that channel can run `/issue` to create GitHub issues.

### 5. Set Up Closure Notifications (Optional)

Follow the webhook instructions the bot gave you in step 3. This enables the bot to notify users when their reported issues get closed.

Optionally set a different channel for notifications:

```
/setup webhook-channel #notifications
```

### 6. Link GitHub Usernames (Optional)

Users can link their GitHub account so issues show their profile:

```
/github link username:octocat
```

---

## How It Works

```
Discord User → /issue → Modal (title, description, labels)
                            ↓
                    BugSnitch creates issue via GitHub API
                            ↓
                    Rich embed posted in Discord channel
                            ↓
              GitHub webhook fires on issue close
                            ↓
              BugSnitch pings the original reporter
```

---

## Self-Hosting

BugSnitch is open source and can be self-hosted. You'll need:

- Node.js 22+
- PostgreSQL 16+
- A Discord application with a bot token
- Docker (for production deployment)

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id

# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/bugsnitch

# Encryption key for GitHub tokens (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_hex_char_key

# Webhook Server
PORT=3000
WEBHOOK_BASE_URL=https://your-domain.com

# Logging
LOG_LEVEL=info
```

### Development

```bash
npm install
npm run db:generate
npm run dev
```

### Production (Docker)

```bash
docker compose up -d
```

The included `Dockerfile` uses a multi-stage build with Node.js 22 Alpine. The `docker-compose.yml` expects external Docker networks named `proxy` and `internal`.

---

## Tech Stack

- **TypeScript** — Strict mode, ES2022
- **discord.js v14** — Discord bot framework
- **@octokit/rest** — GitHub API client
- **Drizzle ORM** — Type-safe PostgreSQL queries
- **Express** — Webhook server for GitHub events
- **Pino** — Structured JSON logging
- **Docker** — Multi-stage production builds

---

## Project Structure

```
src/
├── index.ts              # Application entry point
├── config.ts             # Environment variable parsing
├── bot/
│   ├── client.ts         # Discord client setup
│   ├── commands/         # Slash command handlers
│   ├── events/           # Discord event handlers
│   └── modals/           # Modal submission handlers
├── server/
│   ├── index.ts          # Express app
│   └── routes/           # Health check + GitHub webhook
├── db/
│   ├── schema.ts         # Drizzle table definitions
│   ├── index.ts          # Database connection
│   └── migrate.ts        # Migration runner
├── services/
│   ├── github.ts         # GitHub API operations
│   ├── encryption.ts     # AES-256-GCM token encryption
│   └── notifications.ts  # Discord closure notifications
└── utils/
    ├── logger.ts         # Pino logger
    └── embeds.ts         # Discord embed builders
```

---

## Security

- GitHub tokens are encrypted with **AES-256-GCM** before storage. The encryption key never leaves the server environment.
- Webhook payloads are verified using **HMAC-SHA256** signatures with per-server secrets.
- Setup commands are restricted to **server administrators only**.
- The bot token and encryption key are loaded from environment variables, never committed to the repository.

---

## License

MIT
