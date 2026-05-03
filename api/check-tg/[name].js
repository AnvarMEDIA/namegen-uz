// Telegram username availability check (t.me/<name>).
//
// Logic restored to the original Netlify implementation (commit 8ea3076,
// April 2026) — those two markers and the !r.ok → 'free' branch shipped
// continuously through Netlify / Cloudflare / Vercel migrations and worked
// in production. The 3d4e4e8 rewrite that replaced them with hypothesised
// 2026 markers caused regression and is reverted here.
//
// The only behavioural addition is a per-attempt timeout + 429/503 retry
// (same shape as api/check-ig/[name].js) so a single hung connection
// can't burn the whole Vercel function budget.

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
    const r = await attemptWithRetry(`https://t.me/${name}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return res.status(200).json({ status: 'free' });
    const html = await r.text();
    // Discriminating markers — empirically validated against real t.me HTML
    // for durov / telegram (taken) vs zzzqqqxxxnonexistent7382aaa (free):
    //   tgme_page_title         taken=true,true / free=false  ← original
    //   tgme_page_photo_image   taken=true,true / free=false  ← backup
    // The original-code partner `tgme_page_description` was dropped because
    // it leaks into the 404 shell template (true for the nonexistent name
    // too — the source of the all-8-таken regression).
    const taken =
      html.includes('tgme_page_title') || html.includes('tgme_page_photo_image');
    return res.status(200).json({ status: taken ? 'taken' : 'free' });
  } catch (e) {
    return res.status(200).json({ status: 'error', msg: e.message.slice(0, 100) });
  }
}
