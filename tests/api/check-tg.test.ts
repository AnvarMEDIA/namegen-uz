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

function mockReq(name: string, method = 'GET'): { method: string; query: Record<string, string> } {
  return { method, query: { name } };
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html' } });
}

function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, headers });
}

describe('api/check-tg — restored original markers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 405 for non-GET methods without touching fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov', 'POST'),
      res,
    );
    expect(cap.status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('200 with tgme_page_title marker → taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse('<div class="tgme_page_title">Pavel</div>'),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken' });
  });

  it('200 with tgme_page_description marker → taken', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () =>
        htmlResponse('<meta property="tgme_page_description">about</meta>'),
      ),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('telegram'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken' });
  });

  it('200 with no markers → free (matches original Netlify behaviour)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () => htmlResponse('<html>nothing</html>')),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('zzzqqqxxxnone7382'),
      res,
    );
    expect(cap.body).toEqual({ status: 'free' });
  });

  it('non-200 (e.g. 404) → free (matches original Netlify behaviour)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () => emptyResponse(404)),
    );
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('zzzqqqxxxnone7382'),
      res,
    );
    expect(cap.body).toEqual({ status: 'free' });
  });

  it('429 once → retry succeeds → markers classified', async () => {
    let call = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      call += 1;
      if (call === 1) return emptyResponse(429, { 'retry-after': '0' });
      return htmlResponse('<div class="tgme_page_title">x</div>');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('429 twice → falls through with 429 status → free (non-OK branch)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => emptyResponse(429, { 'retry-after': '0' }));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    expect(cap.body).toEqual({ status: 'free' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('network error on every attempt → error status', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      throw new TypeError('fetch failed');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq('durov'),
      res,
    );
    const body = cap.body as { status: string };
    expect(body.status).toBe('error');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
