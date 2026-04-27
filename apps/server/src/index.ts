import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import type { FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import { loadContent } from './content/registry.js';
import { seedIfEmpty } from './content/seed.js';
import { db, pool } from './db/client.js';
import { env } from './env.js';
import { startGuildMaintenance, stopGuildMaintenance } from './game/guild-maintenance.js';
import { startGuildWarsScheduler, stopGuildWarsScheduler } from './game/guild-wars-scheduler.js';
import { createContext } from './trpc/context.js';
import { appRouter, type AppRouter } from './routers/index.js';

async function main() {
  // Hydrate content tables if empty (first boot), then load into the in-memory
  // registry. All routers read from the registry instead of TS arrays.
  await seedIfEmpty(db);
  await loadContent(db);

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
    maxParamLength: 5_000,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.get('/healthz', async (_req, reply) => {
    // Liveness + readiness w jednym — pinguje DB żeby orchestrator nie
    // marszrutował ruchu zanim baza wstanie.
    try {
      await pool.query('SELECT 1');
      return { status: 'ok', ts: Date.now() };
    } catch (err) {
      app.log.error({ err }, 'healthz: db ping failed');
      return reply.code(503).send({ status: 'degraded', ts: Date.now() });
    }
  });

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
      onError({ path, error }) {
        app.log.error({ path, err: error }, 'tRPC error');
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  });

  await app.listen({ host: env.HOST, port: env.PORT });
  app.log.info(`Szczurogród server listening on http://${env.HOST}:${env.PORT}`);

  // Guild wars — cron setInterval(60s). Scan'uje overdue wojny i rozwiązuje.
  startGuildWarsScheduler(db);
  // Guild maintenance — cron 1h. Auto-transfer/disband inactive gildii.
  startGuildMaintenance(db);

  // ===== Graceful shutdown =====
  // SIGTERM (k8s/docker stop) i SIGINT (Ctrl+C) → drain HTTP, ubij scheduler'y,
  // zamknij pool DB. Idempotent guard żeby double-signal nie wywołał double-close.
  let shuttingDown = false;
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, 'shutdown: received signal, draining…');
    try {
      stopGuildWarsScheduler();
      stopGuildMaintenance();
      await app.close();
      await pool.end();
      app.log.info('shutdown: clean exit');
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, 'shutdown: error during teardown');
      process.exit(1);
    }
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
