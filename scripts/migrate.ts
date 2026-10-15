// Usage: npm run migrate [-- --dry-run]
// Applies supabase/migrations/*.sql that haven't been applied yet, each in its own transaction.
// Needs SUPABASE_DB_URL in .env.local (Supabase -> Connect -> Session pooler). Never commit or deploy that URL.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("Set SUPABASE_DB_URL in .env.local (see README).");
  process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");
const dir = "supabase/migrations";

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const tracked = await client.query("select to_regclass('public.schema_migrations') as t");
    const hadTracking = !!tracked.rows[0].t;
    if (!dryRun) {
      await client.query("create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())");
    }

    let baselined = false;
    // First run: 0001 was applied by hand in the SQL editor, so record it instead of re-running it.
    if (!hadTracking) {
      const players = await client.query("select to_regclass('public.players') as t");
      if (players.rows[0].t) {
        console.log("Baseline: players table exists, treating 0001_init.sql as already applied.");
        baselined = true;
        if (!dryRun) await client.query("insert into public.schema_migrations (name) values ('0001_init.sql') on conflict do nothing");
      }
    }

    const done = new Set<string>(
      hadTracking || !dryRun ? (await client.query("select name from public.schema_migrations")).rows.map((r) => r.name) : [],
    );
    if (baselined) done.add("0001_init.sql");
    const pending = files.filter((f) => !done.has(f));
    if (!pending.length) return console.log("Up to date. Nothing to apply.");

    for (const f of pending) {
      if (dryRun) { console.log(`Would apply ${f}`); continue; }
      console.log(`Applying ${f} ...`);
      try {
        await client.query("begin");
        await client.query(readFileSync(join(dir, f), "utf8"));
        await client.query("insert into public.schema_migrations (name) values ($1)", [f]);
        await client.query("commit");
        console.log(`  ok`);
      } catch (e) {
        await client.query("rollback");
        throw new Error(`${f} failed and was rolled back: ${(e as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
