const fetch = require('node-fetch');

const H = { 'Content-Type': 'application/json' };
const ok = (body) => ({ statusCode: 200, headers: H, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const pathParts = (event.path || '').split('/');
  const nameRaw = event.queryStringParameters?.name || pathParts[pathParts.length - 1] || '';
  const name = nameRaw.replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  if (!name || name.length < 1) return ok({ status: 'error', msg: 'слишком короткое' });

  // 1. Instagram internal API (не требует авторизации, возвращает 200/404)
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
    if (r.status === 200) return ok({ status: 'taken', source: 'IG API' });
    if (r.status === 404) return ok({ status: 'free',  source: 'IG API' });
    // 401/403 — API заблокировал, пробуем следующий метод
  } catch (_) {}

  // 2. Страница профиля через фacebookexternalhit — обходит редирект на логин
  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(name)}/`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (r.status === 404) return ok({ status: 'free', source: 'IG page' });
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found') || html.includes('Page Not Found')) {
        return ok({ status: 'free', source: 'IG page' });
      }
      if (html.includes('og:title') || html.includes('"@type":"ProfilePage"')) {
        return ok({ status: 'taken', source: 'IG page' });
      }
      // HTML пришёл, но нет явных маркеров — скорее всего логин-стена
      return ok({ status: 'unknown' });
    }
  } catch (_) {}

  return ok({ status: 'unknown' });
};
