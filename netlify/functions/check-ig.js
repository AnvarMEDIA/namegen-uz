const fetch = require('node-fetch');

exports.handler = async (event) => {
  const pathParts = (event.path || '').split('/');
  const nameRaw = event.queryStringParameters?.name || pathParts[pathParts.length - 1] || '';
  const name = nameRaw.replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  const headers = { 'Content-Type': 'application/json' };
  if (!name || name.length < 1) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: 'слишком короткое' }) };
  }

  try {
    const r = await fetch(`https://www.instagram.com/${name}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (r.status === 404) return { statusCode: 200, headers, body: JSON.stringify({ status: 'free' }) };
    if (r.url && r.url.includes('/accounts/login')) {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: 'требуется авторизация' }) };
    }
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found')) {
        return { statusCode: 200, headers, body: JSON.stringify({ status: 'free' }) };
      }
      if (html.includes('accounts/login')) {
        return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: 'требуется авторизация' }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'taken' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: `HTTP ${r.status}` }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: e.message.slice(0, 100) }) };
  }
};
