module.exports = async (req, res) => {
  const nameRaw = req.query?.name || '';
  const name = String(nameRaw).toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || name.length < 2) {
    return res.status(200).json({ status: 'error', msg: 'слишком короткое имя' });
  }

  try {
    const r = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
      headers: { 'Accept': 'application/rdap+json' },
    });
    if (r.status === 200) return res.status(200).json({ status: 'taken', source: 'RDAP' });
    if (r.status === 404) return res.status(200).json({ status: 'free',  source: 'RDAP' });
  } catch (_) {}

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
      if (jns.Status === 3) return res.status(200).json({ status: 'free', source: 'DNS' });
      return res.status(200).json({ status: 'taken', source: 'DNS' });
    }
    return res.status(200).json({ status: 'taken', source: 'DNS' });
  } catch (e) {
    return res.status(200).json({ status: 'error', msg: e.message.slice(0, 120) });
  }
};
