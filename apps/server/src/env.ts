import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** Bearer token required to call admin.* procedures. If unset, admin is disabled. */
  ADMIN_TOKEN: z.string().optional(),
  /** Anthropic API key for town flavor generation. If unset, flavor falls back to hardcoded defaults. */
  ANTHROPIC_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
