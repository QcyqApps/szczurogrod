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

  // ===== Google Play Billing =====
  // Package name from capacitor.config.ts (`com.ratburg`). When set together
  // with one of the service-account envs below, gemShop.verifyPlay can
  // validate purchase tokens against the Play Developer API.
  GOOGLE_PLAY_PACKAGE_NAME: z.string().optional(),
  // Service-account JSON, full content as a stringified env. Friendlier
  // for Docker/secrets manager than mounting a file.
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: z.string().optional(),
  // Alternative: filesystem path to the JSON. Pick one of the two — JSON env
  // takes precedence when both are set.
  GOOGLE_PLAY_SERVICE_ACCOUNT_FILE: z.string().optional(),

  // ===== PayPal Checkout (web fallback dla nie-Capacitor builds) =====
  // PayPal "Client ID" (publicznie ekspozowany jako VITE_PAYPAL_CLIENT_ID na
  // froncie) i "Secret" (server-only, używany do OAuth token exchange).
  // Sandbox creds dostępne w developer.paypal.com → My Apps & Credentials.
  PAYPAL_API_KEY: z.string().optional(),
  PAYPAL_SECRET: z.string().optional(),
  /** Sandbox: https://api-m.sandbox.paypal.com  ·  Live: https://api-m.paypal.com */
  PAYPAL_API_BASE: z.string().url().default('https://api-m.sandbox.paypal.com'),
  /** Webhook ID z PayPal Dashboard → Webhooks. Wymagany dla weryfikacji
   *  podpisu /webhooks/paypal. Bez niego endpoint odrzuca wszystkie eventy. */
  PAYPAL_WEBHOOK_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
