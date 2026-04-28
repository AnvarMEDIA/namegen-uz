module.exports = async (req, res) => {
  const nameRaw = req.query?.name || '';
  const name = String(nameRaw).replace(/[^a-z0-9_]/gi, '').slice(0, 32);

  if (!name || name.length < 3) {
    return res.status(200).json({ status: 'error', msg: 'слишком короткое' });
  }

  try {
    const r = await fetch(`https://t.me/${name}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return res.status(200).json({ status: 'free' });
    const html = await r.text();
    const taken = html.includes('tgme_page_title') || html.includes('tgme_page_description');
    return res.status(200).json({ status: taken ? 'taken' : 'free' });
  } catch (e) {
    return res.status(200).json({ status: 'error', msg: e.message.slice(0, 100) });
  }
};
