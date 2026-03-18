const json = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest(context) {
  const nameRaw = context.params.name || '';
  const name = nameRaw.replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  if (!name || name.length < 1) return json({ status: 'error', msg: 'слишком короткое' });

  // 1. Instagram internal API
  try {
    const r = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(name)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'x-ig-app-id': '936619743392459',
          'x-requested-with': 'XMLHttpRequest',
          'Referer': 'https://www.instagram.com/',
        },
      }
    );
    if (r.status === 200) return json({ status: 'taken', source: 'IG API' });
    if (r.status === 404) return json({ status: 'free',  source: 'IG API' });
  } catch (_) {}

  // 2. Страница профиля через facebookexternalhit
  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(name)}/`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (r.status === 404) return json({ status: 'free', source: 'IG page' });
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found') || html.includes('Page Not Found')) {
        return json({ status: 'free', source: 'IG page' });
      }
      if (html.includes('og:title') || html.includes('"@type":"ProfilePage"')) {
        return json({ status: 'taken', source: 'IG page' });
      }
      return json({ status: 'unknown' });
    }
  } catch (_) {}

  return json({ status: 'unknown' });
}
