const json = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest(context) {
  const nameRaw = context.params.name || '';
  const name = nameRaw.replace(/[^a-z0-9_]/gi, '').slice(0, 32);

  if (!name || name.length < 3) return json({ status: 'error', msg: 'слишком короткое' });

  try {
    const r = await fetch(`https://t.me/${name}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return json({ status: 'free' });
    const html = await r.text();
    const taken = html.includes('tgme_page_title') || html.includes('tgme_page_description');
    return json({ status: taken ? 'taken' : 'free' });
  } catch (e) {
    return json({ status: 'error', msg: e.message.slice(0, 100) });
  }
}
