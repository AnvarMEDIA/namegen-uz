module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const nameRaw = req.query?.name || '';
  const name = String(nameRaw).replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  if (!name || name.length < 1) {
    return res.status(200).json({ status: 'error', msg: 'слишком короткое' });
  }

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
    if (r.status === 200) return res.status(200).json({ status: 'taken', source: 'IG API' });
    if (r.status === 404) return res.status(200).json({ status: 'free',  source: 'IG API' });
  } catch (_) {}

  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(name)}/`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (r.status === 404) return res.status(200).json({ status: 'free', source: 'IG page' });
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found') || html.includes('Page Not Found')) {
        return res.status(200).json({ status: 'free', source: 'IG page' });
      }
      if (html.includes('og:title') || html.includes('"@type":"ProfilePage"')) {
        return res.status(200).json({ status: 'taken', source: 'IG page' });
      }
      return res.status(200).json({ status: 'unknown' });
    }
  } catch (_) {}

  return res.status(200).json({ status: 'unknown' });
};
