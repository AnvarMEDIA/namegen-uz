// Telegram username availability check (t.me/<name>).
//
// Same architecture as api/check-ig/[name].js: per-source timeout, retry
// on 429/503, conservative default 'taken'. Markers reduced to the
// minimal set that survives any t.me layout iteration:
//   - dynamic `tg://resolve?domain=<name>` deep link (gold-standard —
//     can never appear in a shell template because of the per-request
//     handle suffix)
//   - `<meta property="og:title"` (any real profile / channel ships
//     OpenGraph metadata)
//   - redirect-off-t.me (Telegram pushes unknown handles to telegram.org)
//
// NEVER returns 'unknown'. False-negative ('taken' when actually free)
// is preferred over false-positive ('free' when actually taken) — the
// latter would mislead a brand owner into buying a $30 .uz domain
// against an unavailable Telegram identity.

const PER_SOURCE_TIMEOUT_MS = 4000;
const MAX_ATTEMPTS_PER_SOURCE = 2;
const BACKOFF_MS = [0, 200, 600];
const MAX_RETRY_AFTER_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
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

function classifyHtml(html, name) {
  // Gold-standard positive signal — dynamic deep-link with the actual
  // requested handle. A shell template can't fake the per-request
  // domain= suffix, so a match is high-confidence proof the entity
  // exists.
  if (html.includes('tg://resolve?domain=' + name)) return 'taken';
  // Any real profile / channel / bot page emits OpenGraph metadata.
  if (html.includes('<meta property="og:title"')) return 'taken';
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

  // HTTP 404 still means free if Telegram ever brings it back.
  if (r.status === 404) return 'free';
  if (r.status !== 200) return null;

  // Strongest negative signal: redirected off t.me. Telegram's modern
  // modal for unknown handles is 200-with-redirect to telegram.org.
  let finalHostname = '';
  try {
    finalHostname = new URL(r.url).hostname;
  } catch (_) {
    /* leave empty */
  }
  if (finalHostname && finalHostname !== 't.me') return 'free';

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
  } catch (_) {
    /* fall through to default */
  }

  return res.status(200).json({ status: 'taken', source: 'default' });
}

export const __test__ = {
  PER_SOURCE_TIMEOUT_MS,
  MAX_ATTEMPTS_PER_SOURCE,
  BACKOFF_MS,
  MAX_RETRY_AFTER_MS,
  parseRetryAfter,
  classifyHtml,
};
