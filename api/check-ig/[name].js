// Instagram username availability check.
//
// Returns one of: { status: 'free' | 'taken' | 'error', source?, msg? }.
// Crucially, NEVER returns 'unknown' — every code path resolves to a
// definite verdict. When both Instagram sources fail (rate-limited,
// timed out, returned junk HTML, etc.) we default to 'taken' as the
// conservative fallback: better to miss a free handle than to claim a
// taken one is free.
//
// Two independent sources are tried in order, each with its own
// retry-with-backoff:
//   1. Internal IG web API (web_profile_info) — returns clean
//      200/404 verdicts when it works.
//   2. Public profile page parsed with permissive HTML markers
//      covering 2026 IG output (login wall, JSON-LD, og:title).

const PER_SOURCE_TIMEOUT_MS = 4000;
const MAX_ATTEMPTS_PER_SOURCE = 2;
// Backoff before attempt[i] when attempt[i-1] returned 429/503 or
// failed with a network/timeout error. Index 0 is unused (first
// attempt has no preceding wait).
const BACKOFF_MS = [0, 200, 600];
const MAX_RETRY_AFTER_MS = 2000;

// Marker priority is fixed: NOT_FOUND wins over everything (it's the
// only definitive negative answer); LOGIN_WALL beats PROFILE because
// IG sometimes shows just the wall without bio/og fields, but only
// for existing accounts (real 404s never trigger the wall).
const NOT_FOUND_MARKERS = [
  'pageNotFound',
  'page_not_found',
  'Page Not Found',
  'Sorry, this page',
];
const LOGIN_WALL_MARKERS = [
  'LoginAndSignupPage',
  '"requireLogin":true',
  'loginForm',
  'login_required',
];
const PROFILE_MARKERS = [
  'og:title',
  'ProfilePage',
  'biography',
  'edge_followed_by',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry-After comes either as numeric seconds or an HTTP-date.
// We honour numeric only — IG (in rare cases when it sends the header)
// always uses the seconds form. HTTP-date support adds parsing edge
// cases without real benefit here; the BACKOFF_MS fallback handles
// those calls.
function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }
  return null;
}

async function fetchWithTimeout(url, opts) {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(PER_SOURCE_TIMEOUT_MS) });
}

// Wraps fetchWithTimeout with retry on 429/503 and on network/timeout
// errors. Returns the final Response (success or last attempt's response)
// or rethrows if every attempt threw. 4xx other than 429 returns
// immediately — retrying a 404 or 401 won't change the answer.
async function attemptWithRetry(url, opts) {
  let lastError = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_SOURCE; attempt++) {
    try {
      const r = await fetchWithTimeout(url, opts);
      if (r.status !== 429 && r.status !== 503) return r;
      // It's 429/503 — retry unless this was the last attempt.
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
  // Unreachable in practice — the loop always returns or throws above.
  if (lastError) throw lastError;
  throw new Error('exhausted retries');
}

// Returns 'free' / 'taken' when a marker matches, or null when the HTML
// is too ambiguous to classify (caller falls through to the next source
// or to the conservative default).
function classifyHtml(html, name) {
  for (const m of NOT_FOUND_MARKERS) {
    if (html.includes(m)) return 'free';
  }
  for (const m of LOGIN_WALL_MARKERS) {
    if (html.includes(m)) return 'taken';
  }
  for (const m of PROFILE_MARKERS) {
    if (html.includes(m)) return 'taken';
  }
  // Strong fallback signal: og:title for an existing IG profile always
  // contains "(@<handle>)". If we missed the og:title marker for any
  // reason but the handle text is in the response, the profile exists.
  if (html.includes('@' + name)) return 'taken';
  return null;
}

async function tryInternalApi(name) {
  const url =
    'https://www.instagram.com/api/v1/users/web_profile_info/?username=' +
    encodeURIComponent(name);
  const r = await attemptWithRetry(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'x-ig-app-id': '936619743392459',
      'x-requested-with': 'XMLHttpRequest',
      'Referer': 'https://www.instagram.com/',
    },
  });
  if (r.status === 200) return 'taken';
  if (r.status === 404) return 'free';
  return null;
}

async function tryProfilePage(name) {
  const url = 'https://www.instagram.com/' + encodeURIComponent(name) + '/';
  const r = await attemptWithRetry(url, {
    headers: {
      'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Accept': 'text/html',
    },
    redirect: 'follow',
  });
  if (r.status === 404) return 'free';
  if (r.status !== 200) return null;
  const html = await r.text();
  return classifyHtml(html, name);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const nameRaw = req.query?.name || '';
  const name = String(nameRaw).replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  if (!name || name.length < 1) {
    return res.status(200).json({ status: 'error', msg: 'слишком короткое' });
  }

  // Source 1: internal IG web API.
  try {
    const result = await tryInternalApi(name);
    if (result) return res.status(200).json({ status: result, source: 'IG API' });
  } catch (_) {
    // Network error or all retries timed out — fall through to source 2.
  }

  // Source 2: public profile page parsed with permissive markers.
  try {
    const result = await tryProfilePage(name);
    if (result) return res.status(200).json({ status: result, source: 'IG page' });
  } catch (_) {
    // Same — fall through to the conservative default.
  }

  // Conservative default: when neither source produced a verdict we
  // assume the handle is taken. This prefers false negatives (missing
  // a free handle) over false positives (claiming a taken one is free)
  // — the latter would publicly embarrass any brand that registered
  // based on this signal.
  return res.status(200).json({ status: 'taken', source: 'default' });
}

// Test-only exports — production callers must use the default export.
// Listing them here keeps the surface explicit and lets unit tests
// verify the building blocks (markers, retry, classification) in
// isolation without spinning up a fake req/res for every assertion.
export const __test__ = {
  PER_SOURCE_TIMEOUT_MS,
  MAX_ATTEMPTS_PER_SOURCE,
  BACKOFF_MS,
  MAX_RETRY_AFTER_MS,
  NOT_FOUND_MARKERS,
  LOGIN_WALL_MARKERS,
  PROFILE_MARKERS,
  parseRetryAfter,
  classifyHtml,
};
