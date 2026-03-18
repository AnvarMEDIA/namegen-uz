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

  const { keywords, style, randomness, mode, name } = req.body;

  // ── Analyse mode ──────────────────────────────────────
  if (mode === 'analyse') {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name обязателен' });
    }
    const safeName = name.trim().slice(0, 40);
    const analyseBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.7,
      system:
        'You are an expert brand analyst specialising in the Uzbekistan and Central Asian market. ' +
        'Return ONLY a raw JSON object — no markdown, no code fences, no extra text.',
      messages: [{
        role: 'user',
        content:
          `Analyse the brand name "${safeName}" for the Uzbekistan market.\n` +
          `Return this exact JSON structure:\n` +
          `{\n` +
          `  "meaning": "what the name means, evokes, or sounds like (2-3 sentences)",\n` +
          `  "associations": ["visual/emotional association 1", "association 2", "association 3"],\n` +
          `  "target_audience": "specific target audience description (1-2 sentences)",\n` +
          `  "strengths": ["brand strength 1", "strength 2", "strength 3"],\n` +
          `  "brand_tip": "one concrete, actionable tip for brand development in Uzbekistan (1-2 sentences)",\n` +
          `  "similar_brands": ["well-known brand with similar feel 1", "similar brand 2", "similar brand 3"]\n` +
          `}\n` +
          `All values must be in Russian language. Return ONLY the JSON object.`
      }]
    };
    try {
      const aResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(analyseBody),
      });
      if (!aResp.ok) {
        const t = await aResp.text();
        return res.status(aResp.status).json({ error: `API ${aResp.status}: ${t.slice(0, 200)}` });
      }
      const aData = await aResp.json();
      const aRaw = (aData?.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
      let analysis;
      try { analysis = JSON.parse(aRaw); }
      catch { return res.status(500).json({ error: 'Невалидный JSON от AI', raw: aRaw.slice(0, 200) }); }
      return res.json(analysis);
    } catch (err) {
      return res.status(503).json({ error: 'Сеть недоступна: ' + err.message.slice(0, 100) });
    }
  }

  // ── Generate mode ─────────────────────────────────────
  if (!keywords || !keywords.trim()) {
    return res.status(400).json({ error: 'keywords обязателен' });
  }

  const randMap = {
    low:    { temperature: 0.3, hint: 'Be CONSERVATIVE and direct. Favour obvious, safe, highly recognisable names that are immediately understood. Minimal creative leaps.' },
    medium: { temperature: 0.8, hint: 'Be BALANCED. Mix familiar patterns with moderate creativity. Some names should surprise, others should feel natural.' },
    high:   { temperature: 1.0, hint: 'Be BOLD and experimental. Unexpected associations, unusual combinations, high creative risk. Surprise the user — avoid the obvious.' },
  };
  const rand = randMap[randomness] || randMap['medium'];

  const styleMap = {
    auto:        'Best style chosen automatically — mix of all approaches for maximum creativity',
    brandable:   'Invented/coined words — sounds real but means nothing (Spotify, Kodak, Zillow, Canva, Google)',
    evocative:   'Evocative names — strong emotional or conceptual association (RedBull, Amazon, Patagonia, Forever21)',
    compound:    'Compound words — two meaningful words fused or blended (FedEx, Microsoft, Facebook, Snapchat)',
    alternate:   'Alternate spelling — intentional creative misspelling (Lyft, Fiverr, Tumblr, Flickr, Dribbble)',
    nonEnglish:  'Non-English words — foreign language roots sounding premium and global (Toyota, Audi, Volvo, Zara)',
    real_words:  'Real words — common English words used unexpectedly as brand names (Apple, Amazon, Stripe, Notion)',
    uzbek_roots: 'Uzbek & Turkic roots — authentic Central Asian roots with modern feel (Nurli, Baxtzor)',
  };
  const styleLabel = styleMap[style] || styleMap['auto'];

  const styleExtra = {
    auto:
      'IMPORTANT: You have FULL creative freedom. Choose the best approach for these specific keywords. ' +
      'Produce a VARIETY across the 8 names — use at least 3 different style techniques. ' +
      'Mix invented words, compound blends, real words, foreign roots as you see fit. ' +
      'Prioritise what feels most natural, memorable, and brandable for this niche.',
    brandable:
      'Rules: invent phonetically pleasing non-words that FEEL like they could be a real global brand. ' +
      'Use consonant+vowel patterns (CV, CVC, CVCV, CVCCV). ' +
      'Good examples: Zova, Nuvo, Tekra, Velix, Qobo, Canva, Asana, Vevox. ' +
      'Bad: random letter strings that are hard to pronounce or read. ' +
      'The invented word should sound confident and professional.',
    evocative:
      'Rules: the name evokes a strong emotion, image, or concept — NOT the literal product/niche. ' +
      'Think metaphors, nature, strength, speed, light, movement, growth, infinity. ' +
      'Examples: Amazon (vast rainforest = huge selection), RedBull (energy/power), Patagonia (wild remote place). ' +
      'The name must FEEL right and create an instant mental image even without knowing the business. ' +
      'Avoid literal descriptions. Embrace poetic and unexpected connections.',
    compound:
      'Rules: fuse 2 meaningful words into one smooth compound brand name. ' +
      'Method 1 — direct concat: keep both words mostly whole (Snapchat, Facebook, Mailchimp). ' +
      'Method 2 — blend/portmanteau: overlap shared sounds or cut word endings (Pinterest=pin+interest, Microsoft=micro+soft). ' +
      'Method 3 — prefix+root: use a descriptive prefix with a root word (DropBox, SoundCloud). ' +
      'Both word parts should add meaning. Result must be one clean word, easy to say.',
    alternate:
      'Rules: start from a real English or Uzbek word connected to the niche, then mutate creatively: ' +
      'drop silent vowels (Tumblr=tumbler−e), double a consonant for punch (Fiverr=fiver+r), ' +
      'swap ph→f, ck→k, er→r, ou→u, replace -le with -l, add/drop letters for visual style. ' +
      'Multiple mutations on one word are OK (Dribbble=dribble+extra b). ' +
      'Result must look INTENTIONAL and stylish — not like a typo or typo-corrected word.',
    nonEnglish:
      'Rules: use actual words or recognisable roots from non-English languages that sound premium. ' +
      'Latin: vita, nova, lux, vox, apex, nexus, pura, forte, cura, viva. ' +
      'Italian: bella, corso, presto, vivo, uno, volta, faro, cento. ' +
      'Japanese: ki, zen, kaze, hana, moto, yomi, nori, tora, koro. ' +
      'Persian/Arabic: noor, mehr, zafar, aman, sabr, raha, yar, asal. ' +
      'Scandinavian: fjord, vik, berg, stark, nord, sol, dal. ' +
      'Use the word as-is OR adapt to pure a-z Latin spelling. ' +
      'The result must sound globally appealing and work as a brand name.',
    real_words:
      'Rules: choose a REAL, common English word used in an unexpected or metaphorical way for the niche. ' +
      'The connection should be indirect, surprising, or poetic — creating curiosity (Apple is not a tech word). ' +
      'Good qualities: short (3-7 chars), well-known, positive connotation, visually clean. ' +
      'Examples of the approach: Stripe (clean/structured), Notion (idea/concept), Slack (casual communication), ' +
      'Oracle (wisdom), Elastic (flexible), Prism (spectrum/multi), Spring (fresh start). ' +
      'Avoid industry jargon or generic words everyone uses. Pick something surprising.',
    uzbek_roots:
      'Core Uzbek roots: nur (light), baxt (happiness), zafar (victory), yulduz (star), ' +
      'tong (dawn), oltin (gold), daryo (river), tog (mountain), gul (flower), bog (garden), ' +
      'ilm (knowledge), mehr (love/warmth), umid (hope), hayot (life), quyosh (sun). ' +
      'Turkic roots: yol (path), kuch (power), bek (strong/leader), ay (moon), el (nation), ' +
      'yer (land), su (water), ot (fire/horse), qara (black/strong), aq (white/pure). ' +
      'Suffixes: -kor (doer), -zor (place of), -chi (worker), -li (with), -on (augmentative). ' +
      'Blend rules: combine 1-2 roots + optional suffix, keep total 4-9 chars. ' +
      'Examples: Nurli, Baxtzor, Tondchi, Yolbek, Kuchay, Elbek, Mehron, Umidkor, Zafaron.',
  };
  const extraInstruction = styleExtra[style]
    ? `\nStyle-specific rules: ${styleExtra[style]}`
    : `\nStyle-specific rules: ${styleExtra['auto']}`;

  const phoneticRule =
    'Universal phonetic rules: ' +
    '(1) max 3 syllables, ' +
    '(2) no consonant clusters of 3+ at word start (no str/spr/spl/ght/thr), ' +
    '(3) must be easy to pronounce for an Uzbek speaker, ' +
    '(4) avoid endings in -ck, -tch, -dge which are awkward in Uzbek, ' +
    '(5) prefer open syllables (ending in vowel) for smoothness.';

  const qualityCriteria =
    'Quality criteria for EVERY name: ' +
    '(A) memorable after hearing once, ' +
    '(B) easy to spell when heard aloud, ' +
    '(C) no unintended negative meaning in Uzbek, Russian, or English, ' +
    '(D) visually balanced — not too many ascenders/descenders, ' +
    '(E) 4-9 characters is the sweet spot (exception: style=short allows 3-6). ' +
    'Reject any name that fails two or more criteria.';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    temperature: rand.temperature,
    system:
      'You are a world-class brand naming consultant specialising in the Uzbek and Central Asian market. ' +
      'You have named 500+ successful brands. Your names are creative, distinctive, and market-ready. ' +
      'CRITICAL FORMAT RULES: names must contain ONLY Latin letters (a-z) and digits (0-9). ' +
      'NO Cyrillic. NO Arabic. NO underscores. NO hyphens. NO spaces. Length 3-12 characters. ' +
      'Respond with ONLY raw JSON — no markdown fences, no comments, no extra text whatsoever.',
    messages: [{
      role: 'user',
      content:
        `Generate 8 high-quality brand names for the niche: "${keywords.trim()}"\n\n` +
        `Creativity level: ${rand.hint}\n\n` +
        `Style: ${styleLabel}${extraInstruction}\n\n` +
        `${phoneticRule}\n\n` +
        `${qualityCriteria}\n\n` +
        `STRICT: the "name" field must match /^[a-z0-9]+$/ — all lowercase.\n` +
        `For each name write:\n` +
        `- tagline_ru: punchy 3-7 word Russian slogan (no full-stop), evokes emotion or value\n` +
        `- tagline_uz: same idea in Latin-script Uzbek (3-7 words, no full-stop)\n\n` +
        `Return ONLY valid JSON:\n` +
        `{"names":[{"name":"nurli","tagline_ru":"Свет в каждом шаге","tagline_uz":"Har qadamda nur"},...]}\n` +
        `Exactly 8 items. All names must be DIFFERENT from each other.`
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

      const isShortStyle = style === 'short';
      const names = (parsed.names || [])
        .filter(r => {
          if (!r?.name) return false;
          const n = r.name.toLowerCase();
          if (!/^[a-z0-9]+$/.test(n)) return false;
          if (n.length < 3 || n.length > 12) return false;
          // prefer sweet-spot length; for short style allow 3+, others prefer 4+
          if (!isShortStyle && n.length < 4) return false;
          // reject 3+ consecutive same letters (aaab, bbb)
          if (/(.)\1\1/.test(n)) return false;
          return true;
        })
        .map(r => ({
          name:       r.name.toLowerCase(),
          tagline_ru: (r.tagline_ru || r.tagline || '').replace(/[.!?]+$/, '').trim(),
          tagline_uz: (r.tagline_uz || '').replace(/[.!?]+$/, '').trim(),
        }))
        // deduplicate by name
        .filter((r, i, arr) => arr.findIndex(x => x.name === r.name) === i)
        .slice(0, 8);
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
