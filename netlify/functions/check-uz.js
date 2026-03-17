const fetch = require('node-fetch');

const H = { 'Content-Type': 'application/json' };
const ok = (body) => ({ statusCode: 200, headers: H, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const pathParts = (event.path || '').split('/');
  const nameRaw = event.queryStringParameters?.name || pathParts[pathParts.length - 1] || '';
  const name = nameRaw.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || name.length < 2) {
    return ok({ status: 'error', msg: 'слишком короткое имя' });
  }

  // 1. RDAP — источник истины (реестр .uz)
  try {
    const r = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
      headers: { 'Accept': 'application/rdap+json' },
      timeout: 6000,
    });
    if (r.status === 200) return ok({ status: 'taken', source: 'RDAP' });
    if (r.status === 404) return ok({ status: 'free',  source: 'RDAP' });
    // другой код — падаем на DNS
  } catch (_) { /* сеть — падаем на DNS */ }

  // 2. Google DNS — запасной вариант
  try {
    const r = await fetch(`https://dns.google/resolve?name=${name}.uz&type=A`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!r.ok) throw new Error(`dns.google HTTP ${r.status}`);
    const j = await r.json();

    // Status 3 = NXDOMAIN. Дополнительно проверяем NS
    if (j.Status === 3) {
      // NXDOMAIN по A — проверим NS на случай делегирования
      const rns = await fetch(`https://dns.google/resolve?name=${name}.uz&type=NS`, {
        headers: { 'Accept': 'application/json' },
      });
      const jns = await rns.json();
      if (jns.Status === 3) return ok({ status: 'free', source: 'DNS' });
      return ok({ status: 'taken', source: 'DNS' });
    }
    // Status 0 с ответом или без — домен существует в DNS → занят
    return ok({ status: 'taken', source: 'DNS' });
  } catch (e) {
    return ok({ status: 'error', msg: e.message.slice(0, 120) });
  }
};
