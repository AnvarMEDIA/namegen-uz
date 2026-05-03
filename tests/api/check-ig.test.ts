import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line — file uses literal [name].js per Vercel routing.
import handler, { __test__ } from '../../api/check-ig/[name].js';

interface Capture {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  ended: boolean;
}

interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
  end(): unknown;
}

interface RequestLike {
  method?: string;
  query: Record<string, string>;
}

function mockRes(): { res: ResponseLike; cap: Capture } {
  const cap: Capture = { status: 0, body: undefined, headers: {}, ended: false };
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
      cap.ended = true;
      return res;
    },
  };
  return { res, cap };
}

function mockReq(opts: { method?: string; name: string }): RequestLike {
  return { method: opts.method ?? 'GET', query: { name: opts.name } };
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { 'Content-Type': 'text/html' } });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, headers });
}

describe('api/check-ig — request gating', () => {
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
      mockReq({ method: 'POST', name: 'cristiano' }),
      res,
    );
    expect(cap.status).toBe(405);
    expect(cap.body).toEqual({ error: 'Method Not Allowed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api/check-ig — Source 1 (internal API)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Path A 200 → status: taken, source: IG API, no fall-through', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      jsonResponse({ data: { user: { username: 'cristiano' } } }, 200),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'cristiano' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'IG API' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Path A 404 → status: free, source: IG API', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => emptyResponse(404));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'zzzqqqxxxnonexistent7382' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'free', source: 'IG API' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Path A 429 then 200 → retry succeeds → taken', async () => {
    let call = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      call += 1;
      if (call === 1) return emptyResponse(429, { 'retry-after': '0' });
      return jsonResponse({ data: { user: {} } }, 200);
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'cristiano' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'IG API' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('Path A 429 twice → falls through to Path B', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push(url);
      if (url.includes('/api/v1/users/web_profile_info/')) {
        return emptyResponse(429, { 'retry-after': '0' });
      }
      // Path B — return a recognizable profile page
      return htmlResponse(
        '<html><head><meta property="og:title" content="Bar (@bar)"></head></html>',
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'bar' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'IG page' });
    // 2 attempts on Path A + 1 on Path B
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(calls[0]).toContain('/api/v1/users/web_profile_info/');
    expect(calls[1]).toContain('/api/v1/users/web_profile_info/');
    expect(calls[2]).toContain('https://www.instagram.com/bar/');
  });
});

describe('api/check-ig — Source 2 (profile page) + markers', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('Path B HTML with LoginAndSignupPage marker → taken (login wall = profile exists)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/users/web_profile_info/')) {
        return emptyResponse(401); // simulate IG denying anonymous traffic
      }
      return htmlResponse(
        '<html><script>window.__INITIAL_STATE__={"LoginAndSignupPage":{}};</script></html>',
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'mehrobon' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'IG page' });
  });

  it('Path B HTML with og:title marker → taken', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/users/web_profile_info/')) return emptyResponse(401);
      return htmlResponse(
        '<html><head><meta property="og:title" content="Cristiano Ronaldo (@cristiano)"></head></html>',
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'cristiano' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'IG page' });
  });

  it('Path B HTML with pageNotFound marker → free', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/users/web_profile_info/')) return emptyResponse(401);
      return htmlResponse('<html><body>{"pageNotFound":true}</body></html>');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'zzzqqqnope' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'free', source: 'IG page' });
  });

  it('Path B HTML with @<name> handle string → taken (fallback handle marker)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/users/web_profile_info/')) return emptyResponse(401);
      return htmlResponse('<html><body>some markup mentioning @nurzor in body</body></html>');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'nurzor' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'IG page' });
  });
});

describe('api/check-ig — exhaustion → conservative default', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('all sources fail with network errors → status: taken (default)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => {
        throw new TypeError('fetch failed');
      });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'mehrobon' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
    // 2 attempts × 2 sources = 4 calls
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('Path A 500 + Path B 200 with junk HTML (no markers) → taken (default)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/v1/users/web_profile_info/')) return emptyResponse(500);
      // Path B 200 with HTML that contains none of the documented markers
      // and no @<name> handle reference.
      return htmlResponse('<html><body>some unrelated content</body></html>');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'mehrobon' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
  });
});

describe('api/check-ig — internals', () => {
  it('classifyHtml prioritises NOT_FOUND over LOGIN_WALL over PROFILE', () => {
    const html = 'pageNotFound LoginAndSignupPage og:title';
    expect(__test__.classifyHtml(html, 'x')).toBe('free');
  });

  it('classifyHtml returns null when no markers match', () => {
    expect(__test__.classifyHtml('lorem ipsum', 'foo')).toBeNull();
  });

  it('parseRetryAfter accepts numeric seconds and ignores HTTP-date', () => {
    expect(__test__.parseRetryAfter('3')).toBe(3000);
    expect(__test__.parseRetryAfter('0')).toBe(0);
    expect(__test__.parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull();
    expect(__test__.parseRetryAfter(null)).toBeNull();
    expect(__test__.parseRetryAfter('')).toBeNull();
  });

  it('exposes the documented retry/timeout constants', () => {
    expect(__test__.PER_SOURCE_TIMEOUT_MS).toBe(4000);
    expect(__test__.MAX_ATTEMPTS_PER_SOURCE).toBe(2);
    expect(__test__.MAX_RETRY_AFTER_MS).toBe(2000);
  });
});
