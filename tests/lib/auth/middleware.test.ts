import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  clearSessionCookie,
  isEmailAllowed,
  requireAdmin,
  setSessionCookie,
} from '../../../lib/auth/middleware.js';
import { signSession } from '../../../lib/auth/session.js';

const SECRET = 'c'.repeat(64);
const ALLOWED = 'owner@maze.uz, second@maze.uz';

interface Capture {
  cookies: string[];
}

function mockRes(): { res: { setHeader(name: string, value: string | string[]): void }; cap: Capture } {
  const cap: Capture = { cookies: [] };
  return {
    res: {
      setHeader(_name, value) {
        if (Array.isArray(value)) cap.cookies.push(...value);
        else cap.cookies.push(value);
      },
    },
    cap,
  };
}

describe('lib/auth/middleware — requireAdmin + cookie helpers', () => {
  let prevSecret: string | undefined;
  let prevAllowed: string | undefined;
  beforeEach(() => {
    prevSecret = process.env['SESSION_SECRET'];
    prevAllowed = process.env['ADMIN_ALLOWED_EMAILS'];
    process.env['SESSION_SECRET'] = SECRET;
    process.env['ADMIN_ALLOWED_EMAILS'] = ALLOWED;
  });
  afterEach(() => {
    if (prevSecret === undefined) delete process.env['SESSION_SECRET'];
    else process.env['SESSION_SECRET'] = prevSecret;
    if (prevAllowed === undefined) delete process.env['ADMIN_ALLOWED_EMAILS'];
    else process.env['ADMIN_ALLOWED_EMAILS'] = prevAllowed;
  });

  it('isEmailAllowed honours the comma-separated list (case-insensitive)', () => {
    expect(isEmailAllowed('OWNER@maze.uz')).toBe(true);
    expect(isEmailAllowed('second@maze.uz')).toBe(true);
    expect(isEmailAllowed('attacker@example.com')).toBe(false);
  });

  it('returns null when the cookie header is absent', () => {
    expect(requireAdmin({ headers: {} })).toBeNull();
  });

  it('returns null when admin_session cookie carries an unsigned payload', () => {
    const cookie = `admin_session=not-a-valid-cookie`;
    expect(requireAdmin({ headers: { cookie } })).toBeNull();
  });

  it('returns the canonical email for a valid signed cookie on the allow-list', () => {
    const value = signSession({ email: 'owner@maze.uz' });
    const cookie = `admin_session=${value}`;
    expect(requireAdmin({ headers: { cookie } })).toBe('owner@maze.uz');
  });

  it('returns null for a valid signed cookie whose email is NOT on the allow-list', () => {
    const value = signSession({ email: 'attacker@example.com' });
    const cookie = `admin_session=${value}`;
    expect(requireAdmin({ headers: { cookie } })).toBeNull();
  });

  it('setSessionCookie emits a HttpOnly Secure cookie and clearSessionCookie expires it', () => {
    const { res, cap } = mockRes();
    setSessionCookie(res, { email: 'owner@maze.uz' });
    expect(cap.cookies).toHaveLength(1);
    const setCookie = cap.cookies[0] ?? '';
    expect(setCookie).toMatch(/^admin_session=/);
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');

    cap.cookies.length = 0;
    clearSessionCookie(res);
    expect(cap.cookies).toHaveLength(1);
    expect(cap.cookies[0]).toContain('Max-Age=0');
  });
});
