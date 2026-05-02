import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const raw = typeof req.query['name'] === 'string' ? req.query['name'] : '';
  const name = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || name.length < 2) {
    res.status(200).json({ status: 'error', msg: 'слишком короткое имя' });
    return;
  }

  // 1. RDAP — источник истины (реестр .uz)
  try {
    const r = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
      headers: { Accept: 'application/rdap+json' },
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 200) {
      res.status(200).json({ status: 'taken', source: 'RDAP' });
      return;
    }
    if (r.status === 404) {
      res.status(200).json({ status: 'free', source: 'RDAP' });
      return;
    }
  } catch {
    // fall through to DNS fallback
  }

  // 2. Google DNS — запасной вариант
  try {
    const r = await fetch(`https://dns.google/resolve?name=${name}.uz&type=A`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) throw new Error(`dns.google HTTP ${r.status}`);
    const j = (await r.json()) as { Status?: number };

    if (j.Status === 3) {
      const rns = await fetch(`https://dns.google/resolve?name=${name}.uz&type=NS`, {
        headers: { Accept: 'application/json' },
      });
      const jns = (await rns.json()) as { Status?: number };
      if (jns.Status === 3) {
        res.status(200).json({ status: 'free', source: 'DNS' });
        return;
      }
      res.status(200).json({ status: 'taken', source: 'DNS' });
      return;
    }
    res.status(200).json({ status: 'taken', source: 'DNS' });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 120) : 'dns error';
    res.status(200).json({ status: 'error', msg });
  }
}
