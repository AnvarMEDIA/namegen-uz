require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── POST /api/generate ───────────────────────────────────────────────────────
// Проксирует запрос к Anthropic API, скрывая API ключ на сервере
app.post('/api/generate', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY не задан в .env' });
  }

  const { keywords, style } = req.body;
  if (!keywords || !keywords.trim()) {
    return res.status(400).json({ error: 'keywords обязателен' });
  }

  const styleMap = {
    brandable: 'Брендовые (придуманные слова типа Spotify, Kodak)',
    wordmix:   'Словослияние (Facebook = face+book)',
    foreign:   'Иностранные слова (латынь, итальянский, японский)',
    spelling:  'Нестандартное написание (Fiverr, Tumblr)',
    short:     'Максимально короткие (до 6 букв)',
    abstract:  'Абстрактные (без прямой связи с ключевым словом)',
  };
  const styleLabel = styleMap[style] || style;

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: 'You are a brand naming expert. CRITICAL: names must contain ONLY Latin letters (a-z) and digits (0-9). NO Cyrillic. NO Arabic. NO underscores. NO spaces. Length 3-12. Respond with ONLY raw JSON, no markdown.',
    messages: [{
      role: 'user',
      content:
        `Generate 12 brand names for: "${keywords.trim()}"\n` +
        `Style: ${styleLabel}\n` +
        `STRICT: only a-z and 0-9 in the "name" field. The tagline is in Russian (1 short sentence).\n` +
        `Return ONLY: {"names":[{"name":"zuno","tagline":"тэглайн на русском"},...]} — 12 items.`
    }]
  };

  try {
    let attemptsLeft = 4;
    let lastError = null;

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
      }

      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: `Anthropic API ${resp.status}: ${text.slice(0, 300)}` });
      }

      const data = await resp.json();
      const raw = (data?.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
      if (!raw) return res.status(500).json({ error: 'Пустой ответ от API' });

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(500).json({ error: 'Невалидный JSON от API', raw: raw.slice(0, 200) });
      }

      const names = (parsed.names || []).filter(r => r?.name && /^[a-z0-9]+$/i.test(r.name));
      if (!names.length) return res.status(500).json({ error: 'Нет валидных имён в ответе' });

      return res.json({ names });
    }

    return res.status(503).json({ error: 'API перегружен, попробуйте позже' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/check-uz/:name ──────────────────────────────────────────────────
// Проверяет доступность .uz домена через Google DNS (CORS-free на сервере)
app.get('/api/check-uz/:name', async (req, res) => {
  const name = (req.params.name || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!name || name.length < 2) {
    return res.json({ status: 'error', msg: 'слишком короткое имя' });
  }

  try {
    // Сначала Google DNS
    const r = await fetch(`https://dns.google/resolve?name=${name}.uz&type=NS`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!r.ok) throw new Error(`dns.google HTTP ${r.status}`);
    const j = await r.json();

    if (j.Status === 3) {
      return res.json({ status: 'free', source: 'Google DNS' });
    } else if (j.Answer && j.Answer.length > 0) {
      return res.json({ status: 'taken', source: 'Google DNS' });
    } else if (j.Status === 0) {
      return res.json({ status: 'taken', source: 'Google DNS' });
    } else {
      return res.json({ status: 'free', source: 'Google DNS' });
    }
  } catch (e1) {
    // Резерв: RDAP UZINFOCOM
    try {
      const r2 = await fetch(`https://rdap.cctld.uz/domain/${name}.uz`, {
        headers: { 'Accept': 'application/rdap+json' }
      });
      if (r2.status === 200) return res.json({ status: 'taken', source: 'RDAP' });
      if (r2.status === 404) return res.json({ status: 'free', source: 'RDAP' });
      throw new Error(`RDAP HTTP ${r2.status}`);
    } catch (e2) {
      return res.json({ status: 'error', msg: `DNS: ${e1.message} | RDAP: ${e2.message}` });
    }
  }
});

// ─── Fallback SPA ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NameGen.uz запущен: http://localhost:${PORT}`);
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY не задан! Добавьте в файл .env');
  }
});
