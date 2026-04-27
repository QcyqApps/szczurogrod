import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

const JWT_SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = 'grodno';

export interface AccessTokenPayload {
  sub: string; // user id
  typ: 'access';
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience('grodno-web')
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(JWT_SECRET_KEY);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET_KEY, {
    issuer: ISSUER,
    audience: 'grodno-web',
  });
  if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
    throw new Error('Invalid access token payload');
  }
  return { sub: payload.sub, typ: 'access' };
}

// Refresh tokens: opaque random bytes, hashed with SHA-256 before storing.
// Client holds the opaque token; DB stores the hash.
export function generateRefreshToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashRefreshToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

// Convert TTL string like "30d" to milliseconds.
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhdw])$/.exec(ttl.trim());
  if (!match) throw new Error(`Invalid TTL format: ${ttl}`);
  const n = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return n * multipliers[unit];
}
