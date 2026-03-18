const fetch = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY не задан' }) };
  }

  let keywords, style, randomness;
  try {
    ({ keywords, style, randomness } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Невалидный JSON' }) };
  }

  if (!keywords || !keywords.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'keywords обязателен' }) };
  }

  const styleLabel = styleMap[style] || styleMap['auto'];
  const extraInstruction = styleExtra[style]
    ? `\nStyle-specific rules: ${styleExtra[style]}`
    : `\nStyle-specific rules: ${styleExtra['auto']}`;

  // Randomness controls Claude temperature + prompt tone
  const randMap = {
    low:    { temperature: 0.3, hint: 'Be CONSERVATIVE and direct. Favour obvious, safe, highly recognisable names that are immediately understood. Minimal creative leaps.' },
    medium: { temperature: 0.8, hint: 'Be BALANCED. Mix familiar patterns with moderate creativity. Some names should surprise, others should feel natural.' },
    high:   { temperature: 1.0, hint: 'Be BOLD and experimental. Unexpected associations, unusual combinations, high creative risk. Surprise the user — avoid the obvious.' },
  };
  const rand = randMap[randomness] || randMap['medium'];

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
