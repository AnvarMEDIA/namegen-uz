import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import handler, { __test__ } from '../../api/check-tg/[name].js';

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

// Helper: build a Response with an explicit final URL so the handler's
// redirect-detection branch can be exercised. Response.url is read-only
// in spec but Object.defineProperty works in V8/Node 22.
function htmlResponse(html: string, status = 200, finalUrl?: string): Response {
  const r = new Response(html, { status, headers: { 'Content-Type': 'text/html' } });
  if (finalUrl) {
    Object.defineProperty(r, 'url', { value: finalUrl, configurable: true });
  }
  return r;
}

function emptyResponse(status: number, headers: Record<string, string> = {}): Response {
  return new Response('', { status, headers });
}

describe('api/check-tg — request gating', () => {
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
      mockReq({ method: 'POST', name: 'durov' }),
      res,
    );
    expect(cap.status).toBe(405);
    expect(cap.body).toEqual({ error: 'Method Not Allowed' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api/check-tg — positive markers (taken)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('200 + tg://resolve?domain=<name> deep link → taken (gold-standard signal)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<html><a href="tg://resolve?domain=durov">Open</a></html>',
        200,
        'https://t.me/durov',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });

  it('200 + tgme_action_button_label marker → taken', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<div class="tgme_action_button_label">VIEW IN TELEGRAM</div>',
        200,
        'https://t.me/telegram',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'telegram' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });

  it('200 + tgme_page_photo_image marker → taken', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<img class="tgme_page_photo_image" src="...">',
        200,
        'https://t.me/durov',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });

  it('200 + tgme_widget_message marker → taken', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<div class="tgme_widget_message">Latest post</div>',
        200,
        'https://t.me/somechannel',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'somechannel' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
  });
});

describe('api/check-tg — negative signals (free)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('200 redirected off t.me (e.g. telegram.org homepage) → free, source: TG page', async () => {
    // Telegram's modern behaviour for unknown handles: 200-with-redirect
    // to telegram.org. The handler reads response.url and confirms the
    // hostname is no longer t.me → confident free.
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<html><body>Telegram homepage stub</body></html>',
        200,
        'https://telegram.org/?error=USERNAME_NOT_OCCUPIED',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'zzzqqqxxxnone7382' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'free', source: 'TG page' });
  });

  it('200 + tgme_404 marker → free', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse(
        '<div class="tgme_404">Not found</div>',
        200,
        'https://t.me/zzzqqqxxxnone7382',
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'zzzqqqxxxnone7382' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'free', source: 'TG page' });
  });

  it('HTTP 404 → free, source: TG page (kept in case Telegram restores 404)', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => emptyResponse(404));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'zzzqqqxxxnone7382' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'free', source: 'TG page' });
  });
});

describe('api/check-tg — retries', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('429 once then 200 with marker → retry succeeds → taken', async () => {
    let call = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      call += 1;
      if (call === 1) return emptyResponse(429, { 'retry-after': '0' });
      return htmlResponse(
        '<a href="tg://resolve?domain=durov">go</a>',
        200,
        'https://t.me/durov',
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'TG page' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('429 twice → conservative default (taken, source: default)', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => emptyResponse(429, { 'retry-after': '0' }));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('api/check-tg — exhaustion → conservative default (taken)', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('network error on every attempt → taken, source: default', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      throw new TypeError('fetch failed');
    });
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.status).toBe(200);
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('200 + ambiguous HTML (no markers, still on t.me) → taken, source: default', async () => {
    // The exact failure mode that produced the "all 8 taken" pre-fix
    // bug: the page returns 200 on t.me/<name>/ but markup carries
    // none of the documented markers (after the React-SSR refactor
    // the legacy tgme_page_title/_description leaked into 404 shells,
    // so we deliberately do NOT use them). Conservative default
    // applies — better miss a free handle than mislead a brand owner.
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      htmlResponse('<html><body>opaque markup with nothing</body></html>', 200, 'https://t.me/durov'),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
  });

  it('5xx after retries → taken, source: default', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => emptyResponse(500));
    vi.stubGlobal('fetch', fetchMock);
    const { res, cap } = mockRes();
    await (handler as (req: unknown, res: ResponseLike) => Promise<unknown>)(
      mockReq({ name: 'durov' }),
      res,
    );
    expect(cap.body).toEqual({ status: 'taken', source: 'default' });
  });
});

describe('api/check-tg — internals', () => {
  it('classifyHtml prioritises NOT_FOUND > deep-link > PROFILE_MARKERS', () => {
    // NOT_FOUND wins even when other markers also match (defensive
    // priority — Telegram would never serve both for a real handle).
    const html =
      'tgme_404 tgme_action_button_label tg://resolve?domain=durov';
    expect(__test__.classifyHtml(html, 'durov')).toBe('free');
  });

  it('classifyHtml deep-link without markers → taken (strongest positive)', () => {
    expect(
      __test__.classifyHtml('<a href="tg://resolve?domain=durov">x</a>', 'durov'),
    ).toBe('taken');
  });

  it("classifyHtml deep-link with WRONG name → null (must match handle)", () => {
    // Anti-shell-template guard: shell could include a static deep-link
    // for some other handle but not the requested one. Only when the
    // dynamic handle suffix matches do we trust the link.
    expect(
      __test__.classifyHtml('<a href="tg://resolve?domain=other">x</a>', 'durov'),
    ).toBeNull();
  });

  it('classifyHtml returns null when nothing matches', () => {
    expect(__test__.classifyHtml('<html>lorem ipsum</html>', 'durov')).toBeNull();
  });

  it('parseRetryAfter accepts numeric seconds, ignores HTTP-date', () => {
    expect(__test__.parseRetryAfter('5')).toBe(5000);
    expect(__test__.parseRetryAfter('0')).toBe(0);
    expect(__test__.parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT')).toBeNull();
    expect(__test__.parseRetryAfter(null)).toBeNull();
    expect(__test__.parseRetryAfter('')).toBeNull();
  });

  it('parseFinalUrl extracts hostname + pathname from valid URLs', () => {
    expect(__test__.parseFinalUrl('https://t.me/durov')).toEqual({
      hostname: 't.me',
      pathname: '/durov',
    });
    expect(__test__.parseFinalUrl('https://telegram.org/?error=foo')).toEqual({
      hostname: 'telegram.org',
      pathname: '/',
    });
  });

  it('parseFinalUrl returns empty fields for malformed / empty input', () => {
    expect(__test__.parseFinalUrl('')).toEqual({ hostname: '', pathname: '' });
    expect(__test__.parseFinalUrl('not a url')).toEqual({ hostname: '', pathname: '' });
  });

  it('exposes the documented retry/timeout constants', () => {
    expect(__test__.PER_SOURCE_TIMEOUT_MS).toBe(4000);
    expect(__test__.MAX_ATTEMPTS_PER_SOURCE).toBe(2);
    expect(__test__.MAX_RETRY_AFTER_MS).toBe(2000);
  });
});
