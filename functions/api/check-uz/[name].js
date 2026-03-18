const json = (data) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

export async function onRequest(context) {
  const nameRaw = context.params.name || '';
  const name = nameRaw.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || name.length < 2) return json({ status: 'error', msg: 'слишком короткое имя' });

  // 1. RDAP — источник истины (реестр .uz)
  try {
    const r = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
      headers: { 'Accept': 'application/rdap+json' },
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 200) return json({ status: 'taken', source: 'RDAP' });
    if (r.status === 404) return json({ status: 'free',  source: 'RDAP' });
  } catch (_) {}

  // 2. Google DNS — запасной вариант
  try {
    const r = await fetch(`https://dns.google/resolve?name=${name}.uz&type=A`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!r.ok) throw new Error(`dns.google HTTP ${r.status}`);
    const j = await r.json();

    if (j.Status === 3) {
      const rns = await fetch(`https://dns.google/resolve?name=${name}.uz&type=NS`, {
        headers: { 'Accept': 'application/json' },
      });
      const jns = await rns.json();
      if (jns.Status === 3) return json({ status: 'free', source: 'DNS' });
      return json({ status: 'taken', source: 'DNS' });
    }
    return json({ status: 'taken', source: 'DNS' });
  } catch (e) {
    return json({ status: 'error', msg: e.message.slice(0, 120) });
  }
}
