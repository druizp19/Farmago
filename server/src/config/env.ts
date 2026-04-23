import { config } from 'dotenv';

// Load environment variables
config();

export interface EnvConfig {
  // VTEX Configuration
  VTEX_ACCOUNT: string;
  VTEX_APP_KEY: string;
  VTEX_APP_TOKEN: string;

  // Server Configuration
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';

  // CORS Configuration
  CORS_ORIGINS: string[];

  // Redis Configuration (optional)
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: number;
  REDIS_PASSWORD?: string;
}

export const ENV: EnvConfig = {
  VTEX_ACCOUNT: process.env.VTEX_ACCOUNT || '',
  VTEX_APP_KEY: process.env.VTEX_APP_KEY || '',
  VTEX_APP_TOKEN: process.env.VTEX_APP_TOKEN || '',
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  CORS_ORIGINS: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174'],
  REDIS_URL: process.env.REDIS_URL,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
};

export function validateEnv(): void {
  const required = ['VTEX_ACCOUNT', 'VTEX_APP_KEY', 'VTEX_APP_TOKEN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  if (isNaN(ENV.PORT) || ENV.PORT < 1 || ENV.PORT > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }
}
