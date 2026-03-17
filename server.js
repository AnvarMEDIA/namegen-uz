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
    brandable:   'Брендовые (придуманные слова типа Spotify, Kodak)',
    wordmix:     'Словослияние (Facebook = face+book)',
    foreign:     'Иностранные слова (латынь, итальянский, японский)',
    spelling:    'Нестандартное написание (Fiverr, Tumblr)',
    short:       'Максимально короткие (до 6 букв)',
    abstract:    'Абстрактные (без прямой связи с ключевым словом)',
    uzbek_roots: 'Узбекские и тюркские корни',
  };
  const styleLabel = styleMap[style] || style;

  const styleExtra = {
    uzbek_roots:
      'Use Uzbek morphological roots: nur (light), baxt (happiness), zafar (victory), yulduz (star), ' +
      'gulzor (flower garden), tong (dawn), oltin (gold). ' +
      'Combine with Uzbek suffixes: -kor (doer), -zor (place of), -chi (worker), -lik (quality), -bon (keeper). ' +
      'Also draw from Turkic roots: yol (road/path), kuch (strength/power), bek (leader/strong), ' +
      'ay (moon), el (nation/people). ' +
      'Mix both sets freely: nurkor, baxtzor, tondchi, yolbek, kuchay, elbek.',
  };
  const extraInstruction = styleExtra[style]
    ? `\nStyle-specific rules: ${styleExtra[style]}`
    : '';

  const phoneticRule =
    'Phonetic rules for ALL names: max 3 syllables, avoid complex consonant clusters ' +
    '(no str/spr/spl/ght/etc at start), must be easy to pronounce in Uzbek.';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1400,
    system:
      'You are a brand naming expert specialising in the Uzbek market. ' +
      'CRITICAL: names must contain ONLY Latin letters (a-z) and digits (0-9). ' +
      'NO Cyrillic. NO Arabic. NO underscores. NO spaces. Length 3-12 characters. ' +
      'Respond with ONLY raw JSON, no markdown, no extra text.',
    messages: [{
      role: 'user',
      content:
        `Generate 10 brand names for: "${keywords.trim()}"\n` +
        `Style: ${styleLabel}${extraInstruction}\n` +
        `${phoneticRule}\n` +
        `STRICT: only a-z and 0-9 in the "name" field.\n` +
        `For each name provide TWO taglines: tagline_ru in Russian (1 short catchy sentence) ` +
        `and tagline_uz in Uzbek (1 short catchy sentence in Latin Uzbek script).\n` +
        `Return ONLY: {"names":[{"name":"nurtek","tagline_ru":"Свет технологий","tagline_uz":"Texnologiya nuri"},...]} — 10 items.`
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

      const names = (parsed.names || [])
        .filter(r => r?.name && /^[a-z0-9]+$/i.test(r.name))
        .map(r => ({
          name:       r.name,
          tagline_ru: r.tagline_ru || r.tagline || '',
          tagline_uz: r.tagline_uz || '',
        }));
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

// ─── GET /api/check-tg/:name ──────────────────────────────────────────────────
// Проверяет занятость username в Telegram через t.me
app.get('/api/check-tg/:name', async (req, res) => {
  const name = (req.params.name || '').replace(/[^a-z0-9_]/gi, '').slice(0, 32);
  if (!name || name.length < 3) return res.json({ status: 'error', msg: 'слишком короткое' });
  try {
    const r = await fetch(`https://t.me/${name}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!r.ok) return res.json({ status: 'free' });
    const html = await r.text();
    const taken = html.includes('tgme_page_title') || html.includes('tgme_page_description');
    return res.json({ status: taken ? 'taken' : 'free' });
  } catch (e) {
    return res.json({ status: 'error', msg: e.message.slice(0, 100) });
  }
});

// ─── GET /api/check-ig/:name ──────────────────────────────────────────────────
// Проверяет занятость username в Instagram
app.get('/api/check-ig/:name', async (req, res) => {
  const name = (req.params.name || '').replace(/[^a-z0-9._]/gi, '').slice(0, 30);
  if (!name || name.length < 1) return res.json({ status: 'error', msg: 'слишком короткое' });
  try {
    const r = await fetch(`https://www.instagram.com/${name}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (r.status === 404) return res.json({ status: 'free' });
    if (r.url && r.url.includes('/accounts/login')) return res.json({ status: 'error', msg: 'требуется авторизация' });
    if (r.status === 200) {
      const html = await r.text();
      if (html.includes('"pageNotFound"') || html.includes('page_not_found')) {
        return res.json({ status: 'free' });
      }
      if (html.includes('accounts/login')) return res.json({ status: 'error', msg: 'требуется авторизация' });
      return res.json({ status: 'taken' });
    }
    return res.json({ status: 'error', msg: `HTTP ${r.status}` });
  } catch (e) {
    return res.json({ status: 'error', msg: e.message.slice(0, 100) });
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
