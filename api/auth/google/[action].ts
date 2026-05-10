import type { VercelRequest, VercelResponse } from '@vercel/node';
import { decodeIdToken, generateCodeVerifier, generateState, OAuth2RequestError } from 'arctic';

import {
  createGoogleClient,
  GOOGLE_SCOPES,
  OAUTH_FLOW_TTL_MS,
  OAUTH_PKCE_COOKIE,
  OAUTH_STATE_COOKIE,
} from '../../../lib/auth/google.js';
import {
  clearSessionCookie,
  isEmailAllowed,
  setSessionCookie,
} from '../../../lib/auth/middleware.js';
import { logSecurityEvent } from '../../../lib/security/log.js';

export interface RequestLike {
  method?: string | undefined;
  url?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined> | undefined;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string | string[]): unknown;
  json(body: unknown): unknown;
  end(body?: string): unknown;
}

const FLOW_TTL_SECONDS = Math.floor(OAUTH_FLOW_TTL_MS / 1000);

function pickHeader(req: RequestLike, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickQuery(req: RequestLike, name: string): string | undefined {
  const q = req.query?.[name];
  if (Array.isArray(q)) return q[0];
  return q;
}

function pickAction(req: RequestLike): string {
  const fromQuery = pickQuery(req, 'action');
  if (typeof fromQuery === 'string' && fromQuery.length > 0) return fromQuery;
  // Fallback for environments that don't fill req.query for dynamic segments.
  const url = req.url ?? '';
  const last = url.split('?')[0]?.split('/').pop() ?? '';
  return last;
}

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

function flowCookie(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${FLOW_TTL_SECONDS}`;
}

function clearFlowCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function setCookies(res: ResponseLike, cookies: readonly string[]): void {
  res.setHeader('Set-Cookie', [...cookies]);
}

async function handleLogin(_req: RequestLike, res: ResponseLike): Promise<unknown> {
  let google;
  try {
    google = createGoogleClient();
  } catch (err) {
    logSecurityEvent('admin_oauth_misconfigured', {
      reason: err instanceof Error ? err.message : 'unknown',
    });
    return res.status(500).json({ error: 'OAuth not configured' });
  }
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [...GOOGLE_SCOPES]);

  setCookies(res, [
    flowCookie(OAUTH_STATE_COOKIE, state),
    flowCookie(OAUTH_PKCE_COOKIE, codeVerifier),
  ]);
  res.setHeader('Location', url.toString());
  return res.status(302).end();
}

interface IdTokenClaims {
  email?: unknown;
  email_verified?: unknown;
  hd?: unknown;
}

async function handleCallback(req: RequestLike, res: ResponseLike): Promise<unknown> {
  const cookieHeader = pickHeader(req, 'cookie') ?? '';
  const cookies = parseCookieHeader(cookieHeader);
  const code = pickQuery(req, 'code');
  const state = pickQuery(req, 'state');
  const storedState = cookies[OAUTH_STATE_COOKIE];
  const codeVerifier = cookies[OAUTH_PKCE_COOKIE];

  // Always clear flow cookies, regardless of outcome.
  const clearFlow = [
    clearFlowCookie(OAUTH_STATE_COOKIE),
    clearFlowCookie(OAUTH_PKCE_COOKIE),
  ];

  if (
    typeof code !== 'string' ||
    typeof state !== 'string' ||
    typeof storedState !== 'string' ||
    typeof codeVerifier !== 'string' ||
    state.length === 0 ||
    storedState.length === 0
  ) {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_state_missing', {});
    return res.status(400).json({ error: 'Invalid OAuth callback' });
  }

  if (state !== storedState) {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_state_mismatch', {});
    return res.status(400).json({ error: 'Invalid OAuth state' });
  }

  let google;
  try {
    google = createGoogleClient();
  } catch (err) {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_misconfigured', {
      reason: err instanceof Error ? err.message : 'unknown',
    });
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  let idTokenRaw: string;
  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    idTokenRaw = tokens.idToken();
  } catch (err) {
    setCookies(res, clearFlow);
    if (err instanceof OAuth2RequestError) {
      logSecurityEvent('admin_oauth_provider_error', { code: err.code });
    } else {
      logSecurityEvent('admin_oauth_exchange_failed', {
        reason: err instanceof Error ? err.message : 'unknown',
      });
    }
    return res.status(400).json({ error: 'Token exchange failed' });
  }

  let claims: IdTokenClaims;
  try {
    claims = decodeIdToken(idTokenRaw) as IdTokenClaims;
  } catch {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_idtoken_invalid', {});
    return res.status(400).json({ error: 'Invalid ID token' });
  }

  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (!email || !verified) {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_email_unverified', {});
    return res.status(403).json({ error: 'Email not verified' });
  }

  if (!isEmailAllowed(email)) {
    setCookies(res, clearFlow);
    logSecurityEvent('admin_oauth_email_not_allowed', { email });
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Set the long-lived admin_session, then clear the short-lived flow cookies.
  const cookieHeaders: string[] = [];
  // Re-implement setSessionCookie inline so we can batch with flow-cookie clears.
  setSessionCookie({
    setHeader: (_n: string, v: string | string[]): unknown => {
      if (Array.isArray(v)) cookieHeaders.push(...v);
      else cookieHeaders.push(v);
      return undefined;
    },
  }, { email });
  setCookies(res, [...cookieHeaders, ...clearFlow]);

  res.setHeader('Location', '/admin');
  logSecurityEvent('admin_login_success', { email });
  return res.status(302).end();
}

async function handleLogout(_req: RequestLike, res: ResponseLike): Promise<unknown> {
  const cookieHeaders: string[] = [];
  clearSessionCookie({
    setHeader: (_n: string, v: string | string[]): unknown => {
      if (Array.isArray(v)) cookieHeaders.push(...v);
      else cookieHeaders.push(v);
      return undefined;
    },
  });
  setCookies(res, cookieHeaders);
  res.setHeader('Location', '/');
  return res.status(302).end();
}

export async function handle(req: RequestLike, res: ResponseLike): Promise<unknown> {
  const action = pickAction(req);

  if (action === 'login') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    return handleLogin(req, res);
  }
  if (action === 'callback') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    return handleCallback(req, res);
  }
  if (action === 'logout') {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    return handleLogout(req, res);
  }
  return res.status(404).json({ error: 'Unknown action' });
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  return handle(req, res);
}
