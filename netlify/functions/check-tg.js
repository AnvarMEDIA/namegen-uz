const fetch = require('node-fetch');

exports.handler = async (event) => {
  const pathParts = (event.path || '').split('/');
  const nameRaw = event.queryStringParameters?.name || pathParts[pathParts.length - 1] || '';
  const name = nameRaw.replace(/[^a-z0-9_]/gi, '').slice(0, 32);

  const headers = { 'Content-Type': 'application/json' };
  if (!name || name.length < 3) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: 'слишком короткое' }) };
  }

  try {
    const r = await fetch(`https://t.me/${name}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return { statusCode: 200, headers, body: JSON.stringify({ status: 'free' }) };
    const html = await r.text();
    const taken = html.includes('tgme_page_title') || html.includes('tgme_page_description');
    return { statusCode: 200, headers, body: JSON.stringify({ status: taken ? 'taken' : 'free' }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'error', msg: e.message.slice(0, 100) }) };
  }
};
