// ── Security helpers ──────────────────────────────────────
// In-memory rate-limiter (per warm instance). For multi-instance global
// enforcement use Upstash/Redis or Vercel KV.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;
const _rl = new Map(); // ip -> { count, resetAt }
function rateLimit(ip) {
  const now = Date.now();
  // periodic cleanup to bound memory
  if (_rl.size > 2000) {
    for (const [k, v] of _rl) if (v.resetAt < now) _rl.delete(k);
  }
  const e = _rl.get(ip);
  if (!e || e.resetAt < now) {
    _rl.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (e.count >= RL_MAX) return false;
  e.count++;
  return true;
}

// Strip control characters (NUL, CR, LF, tab, etc.) — main vector for
// prompt-injection breakouts via fake "system" lines.
function sanitiseUserText(s) {
  return String(s).replace(/[\x00-\x1F\x7F]+/g, ' ').trim();
}

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
  '(E) 4-10 characters is the sweet spot. ' +
  'Reject any name that fails two or more criteria.';

const randMap = {
  low:    { temperature: 0.3, hint: 'Be CONSERVATIVE and direct. Favour obvious, safe, highly recognisable names that are immediately understood. Minimal creative leaps.' },
  medium: { temperature: 0.8, hint: 'Be BALANCED. Mix familiar patterns with moderate creativity. Some names should surprise, others should feel natural.' },
  high:   { temperature: 1.0, hint: 'Be BOLD and experimental. Unexpected associations, unusual combinations, high creative risk. Surprise the user — avoid the obvious.' },
};

module.exports = async (req, res) => {
  // ── Origin allow-list ──────────────────────────────────
  // Browser cross-origin POST always sets Origin; same-origin XHR usually does too.
  // Empty Origin = direct call (curl etc) — allow but rate-limit still applies.
  const origin = req.headers.origin || '';
  const ALLOWED_HOST_RE = /^https:\/\/(naming\.maze\.uz|maze\.uz|[a-z0-9-]+\.vercel\.app)$/;
  const ALLOWED_DEV_RE  = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const originOk = !origin || ALLOWED_HOST_RE.test(origin) || ALLOWED_DEV_RE.test(origin);
  if (!originOk) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // ── Method ─────────────────────────────────────────────
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Per-IP rate-limit ──────────────────────────────────
  // Best-effort in-memory bucket. On Vercel each warm instance has its own Map,
  // so true global enforcement requires Upstash/Redis — TODO.
  const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '')
    .toString().split(',')[0].trim() || 'unknown';
  if (!rateLimit(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Слишком много запросов. Попробуйте через минуту.' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY не задан' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { keywords, style, randomness, mode, name } = body;

  if (mode === 'analyse') {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name обязателен' });
    }
    // Strip control chars + cap length to prevent prompt-injection / token-burn
    const safeName = sanitiseUserText(name).slice(0, 40);
    if (!safeName) return res.status(400).json({ error: 'name недопустим' });

    const aResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
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
            `All values must be in Russian language. Return ONLY the JSON object.`,
        }],
      }),
    });

    if (!aResp.ok) {
      const t = await aResp.text();
      return res.status(aResp.status).json({ error: `API ${aResp.status}: ${t.slice(0, 200)}` });
    }

    const aData = await aResp.json();
    const aRaw = (aData?.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    try {
      return res.status(200).json(JSON.parse(aRaw));
    } catch {
      return res.status(500).json({ error: 'Невалидный JSON от AI', raw: aRaw.slice(0, 200) });
    }
  }

  if (!keywords || typeof keywords !== 'string' || !keywords.trim()) {
    return res.status(400).json({ error: 'keywords обязателен' });
  }
  // Strip control chars + cap length to prevent prompt-injection / token-burn
  const safeKw = sanitiseUserText(keywords).slice(0, 200);
  if (!safeKw) {
    return res.status(400).json({ error: 'keywords недопустим' });
  }

  const styleLabel = styleMap[style] || styleMap['auto'];
  const extraInstruction = styleExtra[style]
    ? `\nStyle-specific rules: ${styleExtra[style]}`
    : `\nStyle-specific rules: ${styleExtra['auto']}`;

  const rand = randMap[randomness] || randMap['medium'];

  const apiBody = {
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
        `Generate 8 high-quality brand names for the niche: "${safeKw}"\n\n` +
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
        `Exactly 8 items. All names must be DIFFERENT from each other.`,
    }],
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
      body: JSON.stringify(apiBody),
    });

    if (resp.status === 429 || resp.status === 529) {
      attemptsLeft--;
      const wait = resp.status === 429 ? 12000 : 5000;
      if (attemptsLeft > 0) {
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      return res.status(503).json({ error: 'API перегружен, попробуйте позже' });
    }

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: `Anthropic API ${resp.status}: ${text.slice(0, 300)}` });
    }

    const data = await resp.json();
    const raw = (data?.content?.[0]?.text || '').replace(/```json|```/g, '').trim();
    if (!raw) return res.status(500).json({ error: 'Пустой ответ от API' });

    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return res.status(500).json({ error: 'Невалидный JSON от API', raw: raw.slice(0, 200) }); }

    const names = (parsed.names || [])
      .filter(r => {
        if (!r?.name) return false;
        const n = r.name.toLowerCase();
        if (!/^[a-z0-9]+$/.test(n)) return false;
        if (n.length < 3 || n.length > 12) return false;
        if (n.length < 4) return false;
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

    if (!names.length) return res.status(500).json({ error: 'Нет валидных имён в ответе' });

    return res.status(200).json({ names });
  }

  return res.status(503).json({ error: 'API перегружен, попробуйте позже' });
};
