import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { verifyAccessToken } from '../auth/tokens.js';
import { db } from '../db/client.js';
import type { Db } from '../db/client.js';

export interface Context {
  db: Db;
  userId: string | null;
  req: CreateFastifyContextOptions['req'];
  res: CreateFastifyContextOptions['res'];
}

export async function createContext(opts: CreateFastifyContextOptions): Promise<Context> {
  const authHeader = opts.req.headers.authorization;
  let userId: string | null = null;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = await verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      // invalid token — leave userId null, protected procedures will reject
    }
  }
  return { db, userId, req: opts.req, res: opts.res };
}
