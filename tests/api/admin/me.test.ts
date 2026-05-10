import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { handle, type RequestLike, type ResponseLike } from '../../../api/admin/me.js';
import { signSession } from '../../../lib/auth/session.js';

const SECRET = 'd'.repeat(64);

interface Capture {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

function mockRes(): { res: ResponseLike; cap: Capture } {
  const cap: Capture = { status: 0, body: undefined, headers: {} };
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
      cap.headers[name] = String(value);
      return res;
    },
    end() {
      return res;
    },
  };
  return { res, cap };
}

describe('api/admin/me', () => {
  let prevSecret: string | undefined;
  let prevAllowed: string | undefined;
  beforeEach(() => {
    prevSecret = process.env['SESSION_SECRET'];
    prevAllowed = process.env['ADMIN_ALLOWED_EMAILS'];
    process.env['SESSION_SECRET'] = SECRET;
    process.env['ADMIN_ALLOWED_EMAILS'] = 'owner@maze.uz';
  });
  afterEach(() => {
    if (prevSecret === undefined) delete process.env['SESSION_SECRET'];
    else process.env['SESSION_SECRET'] = prevSecret;
    if (prevAllowed === undefined) delete process.env['ADMIN_ALLOWED_EMAILS'];
    else process.env['ADMIN_ALLOWED_EMAILS'] = prevAllowed;
  });

  it('405 for non-GET methods', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = { method: 'POST', headers: {} };
    await handle(req, res);
    expect(cap.status).toBe(405);
  });

  it('401 when there is no admin_session cookie', async () => {
    const { res, cap } = mockRes();
    const req: RequestLike = { method: 'GET', headers: {} };
    await handle(req, res);
    expect(cap.status).toBe(401);
    expect(cap.headers['Cache-Control']).toBe('no-store');
  });

  it('200 with email payload when the cookie is valid and on allow-list', async () => {
    const value = signSession({ email: 'owner@maze.uz' });
    const { res, cap } = mockRes();
    const req: RequestLike = {
      method: 'GET',
      headers: { cookie: `admin_session=${value}` },
    };
    await handle(req, res);
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ email: 'owner@maze.uz' });
  });
});
