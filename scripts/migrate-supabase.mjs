import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

loadEnv(".env.local");

const connectionString = process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error("Missing SUPABASE_DATABASE_URL in .env.local.");
  process.exit(1);
}

const sql = readFileSync("supabase/schema.sql", "utf8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Supabase schema migration complete.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Supabase schema migration failed.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}

function loadEnv(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}
