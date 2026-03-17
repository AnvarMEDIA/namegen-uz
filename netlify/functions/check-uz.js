const fetch = require('node-fetch');

exports.handler = async (event) => {
  // URL pattern: /api/check-uz/:name  →  /netlify/functions/check-uz?name=xxx
  // But via redirect it comes as path segment, so we extract from path or querystring
  const pathParts = (event.path || '').split('/');
  const nameRaw = event.queryStringParameters?.name || pathParts[pathParts.length - 1] || '';
  const name = nameRaw.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!name || name.length < 2) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'error', msg: 'слишком короткое имя' }),
    };
  }

  try {
    const r = await fetch(`https://dns.google/resolve?name=${name}.uz&type=NS`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!r.ok) throw new Error(`dns.google HTTP ${r.status}`);
    const j = await r.json();

    let status;
    if (j.Status === 3) {
      status = 'free';
    } else if (j.Answer && j.Answer.length > 0) {
      status = 'taken';
    } else if (j.Status === 0) {
      status = 'taken';
    } else {
      status = 'free';
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, source: 'Google DNS' }),
    };
  } catch (e1) {
    try {
      const r2 = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
        headers: { 'Accept': 'application/rdap+json' }
      });
      if (r2.status === 200) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'taken', source: 'RDAP' }) };
      if (r2.status === 404) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'free', source: 'RDAP' }) };
      throw new Error(`RDAP HTTP ${r2.status}`);
    } catch (e2) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'error', msg: `DNS: ${e1.message} | RDAP: ${e2.message}` }),
      };
    }
  }
};
