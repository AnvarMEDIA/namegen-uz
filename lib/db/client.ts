import { createClient, type Client } from '@libsql/client';

// Singleton libSQL/Turso client — re-used across warm Vercel invocations.
// Lazy-init: env vars are only read on first call so unit tests can set them
// up after module import (or call __resetDbClient() to force re-init).

let cached: Client | null = null;

function readEnv(name: string): string {
  const v = process.env[name];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

export function getDbClient(): Client {
  if (cached) return cached;
  const url = readEnv('TURSO_URL');
  const authToken = readEnv('TURSO_AUTH_TOKEN');
  cached = createClient({ url, authToken });
  return cached;
}

// Test-only: drop the singleton so the next getDbClient() re-reads env.
export function __resetDbClient(): void {
  cached = null;
}
