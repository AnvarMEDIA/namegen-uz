import { Google } from 'arctic';

// Lazy factory: env vars must exist at call time, not at import time, so
// vitest can stub them per-test.

function readEnv(name: string): string {
  const v = process.env[name];
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`${name} is not set`);
  }
  return v;
}

export function createGoogleClient(): Google {
  return new Google(
    readEnv('GOOGLE_CLIENT_ID'),
    readEnv('GOOGLE_CLIENT_SECRET'),
    readEnv('GOOGLE_REDIRECT_URI'),
  );
}

// Scopes requested during /login → Google. We only need the user's email
// (verified via the id_token) — no profile/contacts/calendar.
export const GOOGLE_SCOPES: readonly string[] = ['openid', 'email'];

export const OAUTH_STATE_COOKIE = 'admin_oauth_state';
export const OAUTH_PKCE_COOKIE = 'admin_oauth_pkce';
export const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000; // 10 min — plenty for a Google login.
