function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  discordToken: required('DISCORD_TOKEN'),
  discordClientId: required('DISCORD_CLIENT_ID'),
  databaseUrl: required('DATABASE_URL'),
  encryptionKey: required('ENCRYPTION_KEY'),
  port: parseInt(process.env.PORT || '3000', 10),
  webhookBaseUrl: required('WEBHOOK_BASE_URL'),
  logLevel: process.env.LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',
};
