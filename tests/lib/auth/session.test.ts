import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  SESSION_TTL_MS,
  signSession,
  verifySession,
} from '../../../lib/auth/session.js';

const SECRET = 'a'.repeat(64);

describe('lib/auth/session — HMAC sign/verify', () => {
  let prev: string | undefined;
  beforeEach(() => {
    prev = process.env['SESSION_SECRET'];
    process.env['SESSION_SECRET'] = SECRET;
  });
  afterEach(() => {
    if (prev === undefined) delete process.env['SESSION_SECRET'];
    else process.env['SESSION_SECRET'] = prev;
  });

  it('sign + verify roundtrip for a valid email', () => {
    const cookie = signSession({ email: 'owner@maze.uz' });
    const payload = verifySession({ cookie });
    expect(payload).not.toBeNull();
    expect(payload?.email).toBe('owner@maze.uz');
    expect(payload?.exp).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered signature', () => {
    const cookie = signSession({ email: 'owner@maze.uz' });
    const lastChar = cookie.slice(-1);
    const flipped = lastChar === 'A' ? 'B' : 'A';
    const tampered = cookie.slice(0, -1) + flipped;
    expect(verifySession({ cookie: tampered })).toBeNull();
  });

  it('rejects an expired payload (full-flow time travel)', () => {
    const past = Date.now() - SESSION_TTL_MS - 1000;
    const cookie = signSession({ email: 'owner@maze.uz', now: past });
    expect(verifySession({ cookie })).toBeNull();
  });

  it('rejects malformed cookies (no dot, empty, garbage)', () => {
    expect(verifySession({ cookie: '' })).toBeNull();
    expect(verifySession({ cookie: 'no-dot-here' })).toBeNull();
    expect(verifySession({ cookie: '.onlydot' })).toBeNull();
    expect(verifySession({ cookie: 'onlydot.' })).toBeNull();
  });

  it('rejects when SESSION_SECRET differs between sign and verify', () => {
    const cookie = signSession({ email: 'owner@maze.uz' });
    process.env['SESSION_SECRET'] = 'b'.repeat(64);
    expect(verifySession({ cookie })).toBeNull();
  });
});
