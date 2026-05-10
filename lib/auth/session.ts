import { createHmac, timingSafeEqual } from 'node:crypto';

// Stateless admin session: a base64url-encoded JSON payload joined by '.'
// to a base64url HMAC-SHA256 of that payload, signed with SESSION_SECRET.
// No DB, no server-side store — verification is pure crypto.
//
// payload = { email: string, exp: number /* Unix ms */ }
// cookie  = base64url(JSON(payload)) + '.' + base64url(hmacSha256(b64Payload))

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE_NAME = 'admin_session';

export interface SessionPayload {
  email: string;
  exp: number;
}

function readSecret(): string {
  const secret = process.env['SESSION_SECRET'];
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('SESSION_SECRET is not set or shorter than 32 chars');
  }
  return secret;
}

function b64urlEncode(data: Buffer): string {
  return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(b64Payload: string, secret: string): string {
  return b64urlEncode(createHmac('sha256', secret).update(b64Payload).digest());
}

export interface SignSessionOptions {
  email: string;
  now?: number;
  ttlMs?: number;
}

export function signSession({ email, now, ttlMs }: SignSessionOptions): string {
  const secret = readSecret();
  const exp = (now ?? Date.now()) + (ttlMs ?? SESSION_TTL_MS);
  const payload: SessionPayload = { email, exp };
  const b64 = b64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  return `${b64}.${sign(b64, secret)}`;
}

export interface VerifySessionOptions {
  cookie: string;
  now?: number;
}

export function verifySession({ cookie, now }: VerifySessionOptions): SessionPayload | null {
  if (typeof cookie !== 'string' || cookie.length === 0) return null;
  const dot = cookie.indexOf('.');
  if (dot < 1 || dot === cookie.length - 1) return null;
  const b64Payload = cookie.slice(0, dot);
  const provided = cookie.slice(dot + 1);

  let secret: string;
  try {
    secret = readSecret();
  } catch {
    return null;
  }

  const expected = sign(b64Payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(b64urlDecode(b64Payload).toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const p = parsed as Record<string, unknown>;
  const email = p['email'];
  const exp = p['exp'];
  if (typeof email !== 'string' || email.length === 0) return null;
  if (typeof exp !== 'number' || !Number.isFinite(exp)) return null;
  if ((now ?? Date.now()) >= exp) return null;

  return { email, exp };
}
