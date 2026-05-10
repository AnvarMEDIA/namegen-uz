import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  signSession,
  verifySession,
} from './session.js';

export interface AdminRequestLike {
  headers: Record<string, string | string[] | undefined>;
}

export interface AdminResponseLike {
  setHeader(name: string, value: string | string[]): unknown;
}

const ALLOWED_EMAILS_ENV = 'ADMIN_ALLOWED_EMAILS';

function parseCookieHeader(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of raw.split(';')) {
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const k = pair.slice(0, eq).trim();
    const v = pair.slice(eq + 1).trim();
    if (k.length === 0) continue;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function pickHeader(req: AdminRequestLike, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getAllowedEmails(): string[] {
  const raw = process.env[ALLOWED_EMAILS_ENV];
  if (typeof raw !== 'string' || raw.length === 0) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isEmailAllowed(email: string): boolean {
  const list = getAllowedEmails();
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

// Reads the admin_session cookie from req, verifies its HMAC, checks it
// against the ADMIN_ALLOWED_EMAILS allow-list. Returns the canonical email
// on success, otherwise null. No side effects, no DB.
export function requireAdmin(req: AdminRequestLike): string | null {
  const cookieHeader = pickHeader(req, 'cookie');
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  const raw = cookies[SESSION_COOKIE_NAME];
  if (!raw) return null;
  const payload = verifySession({ cookie: raw });
  if (!payload) return null;
  if (!isEmailAllowed(payload.email)) return null;
  return payload.email.toLowerCase();
}

function appendSetCookie(res: AdminResponseLike, value: string): void {
  // Multiple Set-Cookie headers are valid HTTP — Vercel's response object
  // accepts an array for setHeader('Set-Cookie', …). Single-value callers
  // hit the string path.
  res.setHeader('Set-Cookie', value);
}

export interface SetSessionCookieOptions {
  email: string;
  now?: number;
  ttlMs?: number;
}

export function setSessionCookie(
  res: AdminResponseLike,
  opts: SetSessionCookieOptions,
): string {
  const value = signSession({
    email: opts.email,
    ...(opts.now !== undefined ? { now: opts.now } : {}),
    ...(opts.ttlMs !== undefined ? { ttlMs: opts.ttlMs } : {}),
  });
  const maxAge = Math.floor((opts.ttlMs ?? SESSION_TTL_MS) / 1000);
  const cookie =
    `${SESSION_COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  appendSetCookie(res, cookie);
  return value;
}

export function clearSessionCookie(res: AdminResponseLike): void {
  appendSetCookie(
    res,
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}
