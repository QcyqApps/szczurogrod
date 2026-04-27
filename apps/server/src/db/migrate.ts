import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.js';

async function main() {
  console.log('running migrations...');
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  console.log('migrations done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
