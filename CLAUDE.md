# BugSnitch

Discord bot that snitches bugs to GitHub. Multi-server support with per-guild configuration.

## Architecture

- Discord.js v14 bot + Express webhook server in single process
- PostgreSQL via Drizzle ORM
- AES-256-GCM encrypted GitHub tokens at rest
- GitHub webhooks for issue closure notifications

## Commands

```
npm run dev          # Development with tsx watch
npm run build        # TypeScript compilation
npm run start        # Production start
npm run db:generate  # Generate Drizzle migrations after schema changes
npm run db:migrate   # Run pending migrations
```

## Project Structure

```
src/bot/       - Discord bot (client, commands, events, modals)
src/server/    - Express webhook server
src/db/        - Drizzle schema and migrations
src/services/  - GitHub API, encryption, notifications
src/utils/     - Logger, embed builders
```

## Conventions

- ESM with `"type": "module"` in package.json
- All .ts imports use .js extension (Node16 module resolution)
- Config via environment variables, validated at startup
- Pino logger with pino-pretty in development
- Ephemeral replies for admin commands, public for issue creation
