// Applies migrations/*.sql in name order, each once, each in its own transaction, and records
// them in schema_migrations. There is no down: a rollback runs older code on the newer schema,
// which is why every migration must work with the release before it (see MIGRATIONS.md).
//   DATABASE_URL=postgres://… node migrate.js
import { readdirSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

const dir = new URL('./migrations/', import.meta.url);

export function migrationFiles() {
  return readdirSync(dir).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
}

export function kindOf(sql) {
  return (sql.match(/^--\s*kind:\s*(expand|contract)\s*$/m) || [])[1] || null;
}

export async function migrate(client, log = console.log) {
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, kind TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())',
  );
  const done = new Set((await client.query('SELECT id FROM schema_migrations')).rows.map((r) => r.id));
  const applied = [];
  for (const f of migrationFiles()) {
    if (done.has(f)) continue;
    const sql = readFileSync(new URL(f, dir), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id, kind) VALUES ($1, $2)', [f, kindOf(sql)]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`${f}: ${err.message}`);
    }
    applied.push(f);
    log(`applied ${f}`);
  }
  return applied;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const applied = await migrate(client);
    console.log(applied.length ? `${applied.length} migration(s) applied` : 'schema already current');
  } catch (err) {
    console.error(`migrate: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
