import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  handle,
  type RequestLike,
  type ResponseLike,
} from '../../../../api/auth/google/[action].js';

const SECRET = 'e'.repeat(64);

interface Capture {
  status: number;
  body: unknown;
  cookies: string[];
  location: string | undefined;
}

function mockRes(): { res: ResponseLike; cap: Capture } {
  const cap: Capture = { status: 0, body: undefined, cookies: [], location: undefined };
  const res: ResponseLike = {
    status(code) {
      cap.status = code;
      return res;
    },
    json(body) {
      cap.body = body;
      return res;
    },
    setHeader(name, value) {
      if (name.toLowerCase() === 'set-cookie') {
        if (Array.isArray(value)) cap.cookies.push(...value);
        else cap.cookies.push(String(value));
      } else if (name === 'Location') {
        cap.location = String(value);
      }
      return res;
    },
    end() {
      return res;
    },
  };
  return { res, cap };
}

describe('api/auth/google/[action]', () => {
  const ENV_KEYS = [
    'SESSION_SECRET',
    'ADMIN_ALLOWED_EMAILS',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
  ] as const;
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of ENV_KEYS) prev[k] = process.env[k];
    process.env['SESSION_SECRET'] = SECRET;
    process.env['ADMIN_ALLOWED_EMAILS'] = 'owner@maze.uz';
    process.env['GOOGLE_CLIENT_ID'] = 'test-client-id';
    process.env['GOOGLE_CLIENT_SECRET'] = 'test-client-secret';
    process.env['GOOGLE_REDIRECT_URI'] = 'https://naming.maze.uz/api/auth/google/callback';
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  });

  it('404 for unknown action', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = { method: 'GET', headers: {}, query: { action: 'noop' } };
    await handle(req, res);
    expect(cap.status).toBe(404);
  });

  it('login → 302 with Google authorization URL and sets state + pkce flow cookies', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = { method: 'GET', headers: {}, query: { action: 'login' } };
    await handle(req, res);
    expect(cap.status).toBe(302);
    expect(cap.location).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
    expect(cap.cookies.some((c) => c.startsWith('admin_oauth_state='))).toBe(true);
    expect(cap.cookies.some((c) => c.startsWith('admin_oauth_pkce='))).toBe(true);
  });

  it('callback → 400 when state cookie is missing', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = {
      method: 'GET',
      headers: {},
      query: { action: 'callback', code: 'abc', state: 'xyz' },
    };
    await handle(req, res);
    expect(cap.status).toBe(400);
    // Both flow cookies should be cleared even on failure.
    expect(cap.cookies.some((c) => c.startsWith('admin_oauth_state=') && c.includes('Max-Age=0'))).toBe(true);
  });

  it('callback → 400 when state mismatches stored cookie', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = {
      method: 'GET',
      headers: {
        cookie: 'admin_oauth_state=stored; admin_oauth_pkce=verifier-value',
      },
      query: { action: 'callback', code: 'abc', state: 'tampered' },
    };
    await handle(req, res);
    expect(cap.status).toBe(400);
    expect(cap.body).toEqual({ error: 'Invalid OAuth state' });
  });

  it('logout → 302 to / and emits expired admin_session cookie', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = { method: 'POST', headers: {}, query: { action: 'logout' } };
    await handle(req, res);
    expect(cap.status).toBe(302);
    expect(cap.location).toBe('/');
    expect(cap.cookies.some((c) => c.startsWith('admin_session=') && c.includes('Max-Age=0'))).toBe(true);
  });
});
