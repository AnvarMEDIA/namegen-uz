const fetch = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const styleMap = {
  brandable:   'Invented/coined words — sounds real but means nothing (Spotify, Kodak, Zillow, Canva)',
  wordmix:     'Portmanteau / word blend — two meaningful words fused (Facebook=face+book, Pinterest=pin+interest)',
  foreign:     'Foreign-language roots — Latin, Italian, Japanese, Arabic, Persian loanwords that sound premium',
  spelling:    'Intentional misspelling — drop vowels, double consonants, swap letters (Fiverr, Tumblr, Lyft, Flickr)',
  short:       'Ultra-short — 3-6 characters only, punchy like a domain hack (Ola, Bolt, Uber, Grab)',
  abstract:    'Abstract — no direct semantic link to the niche, purely aesthetic sound (Acura, Aion, Veed)',
  uzbek_roots: 'Uzbek & Turkic roots — authentic roots with modern feel',
};

const styleExtra = {
  brandable:
    'Rules: invent phonetically pleasing non-words. Combine consonant+vowel patterns freely. ' +
    'Good: Zova, Nuvo, Tekra, Velix, Qobo. Bad: random letter strings that are hard to read.',
  wordmix:
    'Rules: pick 2 semantically relevant words, blend smoothly — keep beginning of word1 + end of word2, ' +
    'or overlap shared sounds. Examples: tech+era=techera, market+link=marklink, fast+route=fastrout.',
  foreign:
    'Rules: use recognisable roots from Latin (vita, nova, lux, vox, apex, nexus), Italian (bella, forte, presto, vivo), ' +
    'Japanese (ki, zen, kaze, hana), Persian/Arabic (noor, mehr, zafar, aman). ' +
    'Adapt spelling to pure a-z. Avoid clichés like "maximus" alone.',
  spelling:
    'Rules: start from a real English or Uzbek word related to the niche, then mutate it: ' +
    'drop silent vowels, double a consonant for punch, replace "ph" with "f", "ck" with "k", "er" with "r". ' +
    'Result must still look intentional, not like a typo.',
  short:
    'HARD LIMIT: max 6 characters. Prefer 3-5. Every character counts. ' +
    'Consonant clusters are ok if pronounceable (Bolt, Grab). Can end in vowel for softness (Zova, Kova).',
  abstract:
    'Rules: choose a vowel-heavy or rhythmic structure that sounds appealing regardless of meaning. ' +
    'Target patterns: CVC, CVCV, CVCCV (C=consonant, V=vowel). ' +
    'Avoid names that accidentally spell a word in Russian or Uzbek with a bad meaning.',
  uzbek_roots:
    'Core Uzbek roots: nur (light), baxt (happiness), zafar (victory), yulduz (star), ' +
    'tong (dawn), oltin (gold), daryo (river), tog (mountain), gul (flower), bog (garden), ' +
    'ilm (knowledge), mehr (love/warmth), umid (hope), hayot (life), quyosh (sun). ' +
    'Turkic roots: yol (path), kuch (power), bek (strong/leader), ay (moon), el (nation), ' +
    'yer (land), su (water), ot (fire/horse), qara (black/strong), aq (white/pure). ' +
    'Suffixes: -kor (doer), -zor (place of), -chi (worker), -li (with), -on (augmentative). ' +
    'Blend rules: combine 1-2 roots + optional suffix, keep total 4-9 chars. ' +
    'Examples: Nurli, Baxtzor, Tondchi, Yolbek, Kuchay, Elbek, Mehron, Umidkor.',
};

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
  const extraInstruction = styleExtra[style]
    ? `\nStyle-specific rules: ${styleExtra[style]}`
    : '';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
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

    const isShortStyle = style === 'short';
    const names = (parsed.names || [])
      .filter(r => {
        if (!r?.name) return false;
        const n = r.name.toLowerCase();
        if (!/^[a-z0-9]+$/.test(n)) return false;
        if (n.length < 3 || n.length > 12) return false;
        if (!isShortStyle && n.length < 4) return false;
        if (/(.)\1\1/.test(n)) return false;
        return true;
      })
      .map(r => ({
        name:       r.name.toLowerCase(),
        tagline_ru: (r.tagline_ru || r.tagline || '').replace(/[.!?]+$/, '').trim(),
        tagline_uz: (r.tagline_uz || '').replace(/[.!?]+$/, '').trim(),
      }))
      .filter((r, i, arr) => arr.findIndex(x => x.name === r.name) === i)
      .slice(0, 8);

    if (!names.length) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Нет валидных имён в ответе' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
    };
  }

  return { statusCode: 503, body: JSON.stringify({ error: 'API перегружен, попробуйте позже' }) };
};
