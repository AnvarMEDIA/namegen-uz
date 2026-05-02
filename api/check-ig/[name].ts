import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const raw = typeof req.query['name'] === 'string' ? req.query['name'] : '';
  const name = raw.replace(/[^a-z0-9._]/gi, '').slice(0, 30);

  if (!name) {
    res.status(200).json({ status: 'error', msg: 'слишком короткое' });
    return;
  }

  // 1. Instagram internal API
  try {
    const r = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(name)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: '*/*',
          'x-ig-app-id': '936619743392459',
          'x-requested-with': 'XMLHttpRequest',
          Referer: 'https://www.instagram.com/',
        },
      },
    );
    if (r.status === 200) {
      res.status(200).json({ status: 'taken', source: 'IG API' });
      return;
    }
    if (r.status === 404) {
      res.status(200).json({ status: 'free', source: 'IG API' });
      return;
    }
  } catch {
    // fall through
  }

  // 2. Профильная страница
  try {
    const r = await fetch(`https://www.instagram.com/${encodeURIComponent(name)}/`, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html',
      },
      redirect: 'follow',
    });
    if (r.status === 404) {
      res.status(200).json({ status: 'free', source: 'IG page' });
      return;
    }
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found') || html.includes('Page Not Found')) {
        res.status(200).json({ status: 'free', source: 'IG page' });
        return;
      }
      if (html.includes('og:title') || html.includes('"@type":"ProfilePage"')) {
        res.status(200).json({ status: 'taken', source: 'IG page' });
        return;
      }
      res.status(200).json({ status: 'unknown' });
      return;
    }
  } catch {
    // fall through
  }

  res.status(200).json({ status: 'unknown' });
}
