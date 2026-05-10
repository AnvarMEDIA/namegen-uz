import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { __resetDbClient, getDbClient } from '../../../lib/db/client.js';

describe('lib/db/client — singleton behaviour', () => {
  let prevUrl: string | undefined;
  let prevToken: string | undefined;
  beforeEach(() => {
    prevUrl = process.env['TURSO_URL'];
    prevToken = process.env['TURSO_AUTH_TOKEN'];
    __resetDbClient();
  });
  afterEach(() => {
    __resetDbClient();
    if (prevUrl === undefined) delete process.env['TURSO_URL'];
    else process.env['TURSO_URL'] = prevUrl;
    if (prevToken === undefined) delete process.env['TURSO_AUTH_TOKEN'];
    else process.env['TURSO_AUTH_TOKEN'] = prevToken;
  });

  it('throws when TURSO_URL is missing', () => {
    delete process.env['TURSO_URL'];
    process.env['TURSO_AUTH_TOKEN'] = 'tok';
    expect(() => getDbClient()).toThrow(/TURSO_URL/);
  });

  it('throws when TURSO_AUTH_TOKEN is missing', () => {
    process.env['TURSO_URL'] = 'libsql://example.turso.io';
    delete process.env['TURSO_AUTH_TOKEN'];
    expect(() => getDbClient()).toThrow(/TURSO_AUTH_TOKEN/);
  });

  it('returns the same client on repeated calls (caching)', () => {
    process.env['TURSO_URL'] = 'libsql://example.turso.io';
    process.env['TURSO_AUTH_TOKEN'] = 'tok';
    const a = getDbClient();
    const b = getDbClient();
    expect(a).toBe(b);
  });

  it('__resetDbClient() forces a new instance on the next call', () => {
    process.env['TURSO_URL'] = 'libsql://example.turso.io';
    process.env['TURSO_AUTH_TOKEN'] = 'tok';
    const a = getDbClient();
    __resetDbClient();
    const b = getDbClient();
    expect(a).not.toBe(b);
  });
});
