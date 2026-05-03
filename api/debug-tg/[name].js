// TEMPORARY debug endpoint — diagnostic-only, delete after Telegram
// marker analysis. Fetches t.me/<name> with the same headers as
// api/check-tg/[name].js and dumps everything we need to see why the
// hypothesis-driven marker set in 3d4e4e8 didn't match real HTML.
//
// No rate-limit, no Origin allow-list, no /api/generate-style
// validation — temp scope, narrow name regex is the only guardrail.
// REMOVE before merging the branch to main.

const TG_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html',
};

const STATIC_MARKERS = [
  'tgme_action_button_label',
  'tgme_page_action',
  'tgme_page_photo_image',
  'tgme_widget_message',
  'tgme_404',
  'tgme_no_result',
  'no_result_found',
  // Legacy (pre-React-SSR) markers — checking these proves whether the
  // shell-template-leak hypothesis from 3d4e4e8 holds.
  'tgme_page_title',
  'tgme_page_description',
  // Other shell elements that might be reliable signals.
  'tgme_header_link',
  'tgme_page_photo',
  'tgme_page_extra',
  'og:title',
  'og:image',
  'og:description',
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const nameRaw = String(req.query?.name || '');
  if (!/^[a-z0-9_]{1,32}$/i.test(nameRaw)) {
    return res.status(400).json({ error: 'invalid name (must match /^[a-z0-9_]{1,32}$/i)' });
  }
  const name = nameRaw.toLowerCase();
  const url = 'https://t.me/' + name;

  const t0 = Date.now();
  let response;
  let fetchError = null;
  try {
    response = await fetch(url, {
      headers: TG_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    fetchError = err?.message ? err.message : String(err);
  }
  const elapsed_ms = Date.now() - t0;

  if (fetchError || !response) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).end(
      JSON.stringify({ name, requested_url: url, fetch_error: fetchError, elapsed_ms }, null, 2),
    );
  }

  const html = await response.text();

  const headers = {};
  for (const [k, v] of response.headers.entries()) headers[k] = v;

  let final_hostname = '';
  let final_pathname = '';
  try {
    const u = new URL(response.url);
    final_hostname = u.hostname;
    final_pathname = u.pathname;
  } catch (_) {
    /* leave empty */
  }

  const markers_found = {};
  for (const m of STATIC_MARKERS) markers_found[m] = html.includes(m);
  // Dynamic deep-link with the actual handle (gold-standard signal).
  const dynamicKey = 'tg://resolve?domain=' + name;
  markers_found[dynamicKey] = html.includes(dynamicKey);

  const out = {
    name,
    requested_url: url,
    elapsed_ms,
    http_status: response.status,
    redirected: response.redirected,
    final_url: response.url,
    final_hostname,
    final_pathname,
    redirected_off_t_me: response.redirected && final_hostname !== 't.me',
    html_length: html.length,
    response_headers: headers,
    markers_found,
    html_first_5kb: html.slice(0, 5120),
    html_last_2kb: html.length > 7168 ? html.slice(-2048) : '<<same as first chunk>>',
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).end(JSON.stringify(out, null, 2));
}
