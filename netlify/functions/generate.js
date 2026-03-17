const fetch = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const styleMap = {
  brandable: 'Брендовые (придуманные слова типа Spotify, Kodak)',
  wordmix:   'Словослияние (Facebook = face+book)',
  foreign:   'Иностранные слова (латынь, итальянский, японский)',
  spelling:  'Нестандартное написание (Fiverr, Tumblr)',
  short:     'Максимально короткие (до 6 букв)',
  abstract:  'Абстрактные (без прямой связи с ключевым словом)',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY не задан' }) };
  }

  let keywords, style;
  try {
    ({ keywords, style } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Невалидный JSON' }) };
  }

  if (!keywords || !keywords.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'keywords обязателен' }) };
  }

  const styleLabel = styleMap[style] || style;

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: 'You are a brand naming expert. CRITICAL: names must contain ONLY Latin letters (a-z) and digits (0-9). NO Cyrillic. NO Arabic. NO underscores. NO spaces. Length 3-12. Respond with ONLY raw JSON, no markdown.',
    messages: [{
      role: 'user',
      content:
        `Generate 10 brand names for: "${keywords.trim()}"\n` +
        `Style: ${styleLabel}\n` +
        `STRICT: only a-z and 0-9 in the "name" field. The tagline is in Russian (1 short sentence).\n` +
        `Return ONLY: {"names":[{"name":"zuno","tagline":"тэглайн на русском"},...]} — 10 items.`
    }]
  };

  let attemptsLeft = 4;

  while (attemptsLeft > 0) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (resp.status === 429 || resp.status === 529) {
      attemptsLeft--;
      const wait = resp.status === 429 ? 12000 : 5000;
      if (attemptsLeft > 0) {
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return { statusCode: 503, body: JSON.stringify({ error: 'API перегружен, попробуйте позже' }) };
    }

    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: `Anthropic API ${resp.status}: ${text.slice(0, 300)}` }) };
    }

    const data = await resp.json();
    const raw = (data?.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    if (!raw) return { statusCode: 500, body: JSON.stringify({ error: 'Пустой ответ от API' }) };

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { statusCode: 500, body: JSON.stringify({ error: 'Невалидный JSON от API', raw: raw.slice(0, 200) }) };
    }

    const names = (parsed.names || []).filter(r => r?.name && /^[a-z0-9]+$/i.test(r.name));
    if (!names.length) return { statusCode: 500, body: JSON.stringify({ error: 'Нет валидных имён в ответе' }) };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
    };
  }

  return { statusCode: 503, body: JSON.stringify({ error: 'API перегружен, попробуйте позже' }) };
};
