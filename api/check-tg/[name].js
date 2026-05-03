// Telegram username availability check (t.me/<name>).
//
// Returns one of: { status: 'free' | 'taken' | 'error', source?, msg? }.
// Like check-ig, NEVER returns 'unknown' — every code path resolves to a
// definite verdict. When the t.me request can't produce a clear answer
// (rate-limited, returns junk markup, network error, etc.) the
// conservative default is 'taken': for naming.maze.uz the cost of a
// false 'free' is much higher than a false 'taken' — in Uzbekistan a
// brand depends on Telegram even more than on Instagram, and a user
// who buys a $30 .uz domain on the strength of a wrong 'free' loses
// the matching brand identity. Better to lose a free handle than to
// claim a taken one.
//
// Single source (Telegram exposes only one public anonymous endpoint
// per handle). Reliability comes from: per-request timeout, retry on
// 429/503, redirect-aware classification (Telegram pushes unknown
// handles off t.me onto telegram.org), and a permissive marker set
// covering the 2026 React-SSR layout.

const PER_SOURCE_TIMEOUT_MS = 4000;
const MAX_ATTEMPTS_PER_SOURCE = 2;
// Backoff before attempt[i] when attempt[i-1] was rate-limited or
// failed with a network/timeout error. Index 0 is unused.
const BACKOFF_MS = [0, 200, 600];
const MAX_RETRY_AFTER_MS = 2000;

// Negative markers — explicit "this handle doesn't exist" signals from
// Telegram's own page chrome.
const NOT_FOUND_MARKERS = [
  'tgme_404',
  'tgme_no_result',
  'no_result_found',
];

// Positive markers — only present on real profile / channel / bot
// pages. Telegram's React-SSR shell ships these classes only when the
// underlying entity exists; the previous tgme_page_title / _description
// markers leaked into 404 templates after the 2024 refactor and are
// deliberately NOT used here.
const PROFILE_MARKERS = [
  'tgme_action_button_label',  // "VIEW IN TELEGRAM" CTA
  'tgme_page_action',           // CTA container
  'tgme_page_photo_image',      // profile / channel photo
  'tgme_widget_message',        // bot or channel preview block
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  // HTTP-date variant ignored on purpose — Telegram (when it sends
  // Retry-After at all) uses the seconds form, and the BACKOFF_MS cap
  // covers the date case if it ever shows up.
  return null;
}

async function fetchWithTimeout(url, opts) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(PER_SOURCE_TIMEOUT_MS) });
}

async function attemptWithRetry(url, opts) {
  let lastError = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_SOURCE; attempt++) {
    try {
      const r = await fetchWithTimeout(url, opts);
      if (r.status !== 429 && r.status !== 503) return r;
      if (attempt + 1 >= MAX_ATTEMPTS_PER_SOURCE) return r;
      const retryAfterMs = parseRetryAfter(r.headers.get('retry-after'));
      const baseWait = BACKOFF_MS[attempt + 1] ?? 600;
      const waitMs = Math.min(retryAfterMs ?? baseWait, MAX_RETRY_AFTER_MS);
      await sleep(waitMs);
    } catch (err) {
      lastError = err;
      if (attempt + 1 >= MAX_ATTEMPTS_PER_SOURCE) throw err;
      const waitMs = BACKOFF_MS[attempt + 1] ?? 600;
      await sleep(waitMs);
    }
  }
  if (lastError) throw lastError;
  throw new Error('exhausted retries');
}

// Returns { hostname, pathname } for a parseable URL, or { '', '' } when
// the input is empty or malformed (which happens in unit tests where the
// mock Response wasn't given an explicit .url override).
function parseFinalUrl(url) {
  if (!url) return { hostname: '', pathname: '' };
  try {
    const u = new URL(url);
    return { hostname: u.hostname, pathname: u.pathname };
  } catch {
    return { hostname: '', pathname: '' };
  }
}

function classifyHtml(html, name) {
  // 1. Explicit not-found markers win — Telegram's own "no such handle"
  //    page chrome.
  for (const m of NOT_FOUND_MARKERS) {
    if (html.includes(m)) return 'free';
  }
  // 2. Strongest positive signal: the deep link `tg://resolve?domain=<name>`
  //    only renders when the underlying entity exists. This also pins the
  //    HANDLE — generic shell template can't fake the dynamic name suffix.
  if (html.includes('tg://resolve?domain=' + name)) return 'taken';
  // 3. Profile chrome — any one of these is enough.
  for (const m of PROFILE_MARKERS) {
    if (html.includes(m)) return 'taken';
  }
  return null;
}

async function tryTelegramPage(name) {
  const url = 'https://t.me/' + encodeURIComponent(name);
  const r = await attemptWithRetry(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html',
    },
    redirect: 'follow',
  });

  // Definite negative #1: HTTP 404 (kept in case Telegram brings the
  // status back; the modern behaviour is 200-with-redirect, handled
  // below).
  if (r.status === 404) return 'free';

  // Non-200 (403, 5xx after retries) — caller falls back to default.
  if (r.status !== 200) return null;

  // Definite negative #2: redirected off t.me. Telegram pushes unknown
  // handles to telegram.org/?<error>, and reserved / restricted ones
  // sometimes land on a different t.me path. In both cases the user
  // can attempt to claim the handle, so we surface 'free'.
  const final = parseFinalUrl(r.url);
  const expectedPath = '/' + name;
  const stillOnTarget =
    final.hostname === 't.me' &&
    (final.pathname === expectedPath || final.pathname === expectedPath + '/');
  if (final.hostname && !stillOnTarget) return 'free';

  // HTML parse — last definite layer.
  const html = await r.text();
  return classifyHtml(html, name);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const nameRaw = req.query?.name || '';
  const name = String(nameRaw).replace(/[^a-z0-9_]/gi, '').slice(0, 32);

  if (!name || name.length < 3) {
    return res.status(200).json({ status: 'error', msg: 'слишком короткое' });
  }

  try {
    const result = await tryTelegramPage(name);
    if (result === 'free') return res.status(200).json({ status: 'free', source: 'TG page' });
    if (result === 'taken') return res.status(200).json({ status: 'taken', source: 'TG page' });
    // result === null → ambiguous markup → conservative default.
  } catch (_) {
    // Network error / all retries timed out — conservative default.
  }

  // Conservative default. See file header for why this is 'taken' for
  // Telegram (matches /api/check-ig — false-negative is cheaper than
  // false-positive when a brand depends on the handle).
  return res.status(200).json({ status: 'taken', source: 'default' });
}

// Test-only exports — mirrors check-ig's __test__ surface so unit tests
// can verify the building blocks (markers, retry, parsing) in isolation
// without spinning up req/res mocks for every assertion.
export const __test__ = {
  PER_SOURCE_TIMEOUT_MS,
  MAX_ATTEMPTS_PER_SOURCE,
  BACKOFF_MS,
  MAX_RETRY_AFTER_MS,
  NOT_FOUND_MARKERS,
  PROFILE_MARKERS,
  parseRetryAfter,
  parseFinalUrl,
  classifyHtml,
};
