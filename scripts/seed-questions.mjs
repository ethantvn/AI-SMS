import { readFileSync, existsSync } from "node:fs";

const env = loadEnv(".env.local");
const baseUrl = process.env.SEED_BASE_URL ?? "http://localhost:3000";

let response;
try {
  response = await fetch(`${baseUrl}/api/seed-questions`, {
    method: "POST",
    headers: {
      ...(env.SEED_TOKEN ? { "x-seed-token": env.SEED_TOKEN } : {}),
    },
  });
} catch {
  console.error(`Could not reach ${baseUrl}. Start the app with npm run dev, or set SEED_BASE_URL.`);
  process.exit(1);
}

const body = await response.json().catch(() => ({}));

if (!response.ok) {
  console.error(body.error ?? `Seed request failed with ${response.status}`);
  process.exit(1);
}

console.log(`Seeded ${body.inserted ?? 0} ACT questions.`);

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    values[key] = value;
    process.env[key] ??= value;
  }

  return values;
}
