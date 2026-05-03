import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import handler from '../../api/check-tg/[name].js';

interface Capture {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
  end(): unknown;
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
      cap.headers[name] = value;
      return res;
    },
    end() {
      return res;
    },
  };
  return { res, cap };
}

function mockReq(name: string): { method: string; query: Record<string, string> } {
  return { method: 'GET', query: { name } };
}

function htmlResponse(html: string, status = 200, finalUrl = 'https://t.me/'): Response {
  const r = new Response(html, { status, headers: { 'Content-Type': 'text/html' } });
  Object.defineProperty(r, 'url', { value: finalUrl, configurable: true });
  return r;
}

function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, headers });
}

describe('api/check-tg — minimal markers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 with tg://resolve?domain=<name> deep-link → taken (gold-standard)", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse(
          '<html><a href="tg://resolve?domain=durov">Open</a></html>',
          200,
          'https://t.me/durov',
        ),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });

  it('200 with og:title meta → taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse(
          '<head><meta property="og:title" content="Telegram"></head>',
          200,
          'https://t.me/telegram',
        ),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('telegram'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });

  it('redirected off t.me (telegram.org) → free', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse(
          '<html><body>telegram.org</body></html>',
          200,
          'https://telegram.org/?error=USERNAME_NOT_OCCUPIED',
        ),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('zzzqqqxxxnone7382'),
      res,
    );
    expect(cap.body).toEqual({ status: 'free', source: 'TG page' });
  });

  it('200 with no markers → taken (conservative default)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse(
          '<html><body>opaque markup with nothing</body></html>',
          200,
          'https://t.me/durov',
        ),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
  });

  it('429 twice → taken (default after retry exhaustion)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => emptyResponse(429, { 'retry-after': '0' }));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
