import {
  type RandomnessKey,
  type StyleKey,
  PHONETIC_RULE,
  QUALITY_CRITERIA,
  RANDOMNESS,
  STYLE_LABELS,
  STYLE_RULES,
} from './styles.js';

export interface GeneratePromptInput {
  readonly keywords: string;
  readonly style: StyleKey | undefined;
  readonly randomness: RandomnessKey | undefined;
}

export interface GeneratePrompt {
  readonly system: string;
  readonly user: string;
  readonly temperature: number;
  readonly maxTokens: number;
}

const DEFAULT_STYLE: StyleKey = 'auto';
const DEFAULT_RANDOMNESS: RandomnessKey = 'medium';
const MAX_TOKENS = 2000;

const SYSTEM_PROMPT =
  'You are a world-class brand naming consultant specialising in the Uzbek and Central Asian market. ' +
  'You have named 500+ successful brands. Your names are creative, distinctive, and market-ready. ' +
  'CRITICAL FORMAT RULES: names must contain ONLY Latin letters (a-z) and digits (0-9). ' +
  'NO Cyrillic. NO Arabic. NO underscores. NO hyphens. NO spaces. Length 3-12 characters. ' +
  'Respond with ONLY raw JSON — no markdown fences, no comments, no extra text whatsoever.';

export function buildGeneratePrompt(input: GeneratePromptInput): GeneratePrompt {
  const style = input.style ?? DEFAULT_STYLE;
  const randomness = input.randomness ?? DEFAULT_RANDOMNESS;

  const styleLabel = STYLE_LABELS[style];
  const styleRules = STYLE_RULES[style];
  const rand = RANDOMNESS[randomness];

  const user =
    `Generate 8 high-quality brand names for the niche: "${input.keywords}"\n\n` +
    `Creativity level: ${rand.hint}\n\n` +
    `Style: ${styleLabel}\nStyle-specific rules: ${styleRules}\n\n` +
    `${PHONETIC_RULE}\n\n` +
    `${QUALITY_CRITERIA}\n\n` +
    `STRICT: the "name" field must match /^[a-z0-9]+$/ — all lowercase.\n` +
    `For each name write:\n` +
    `- tagline_ru: punchy 3-7 word Russian slogan (no full-stop), evokes emotion or value\n` +
    `- tagline_uz: same idea in Latin-script Uzbek (3-7 words, no full-stop)\n\n` +
    `Return ONLY valid JSON:\n` +
    `{"names":[{"name":"nurli","tagline_ru":"Свет в каждом шаге","tagline_uz":"Har qadamda nur"},...]}\n` +
    `Exactly 8 items. All names must be DIFFERENT from each other.`;

  return {
    system: SYSTEM_PROMPT,
    user,
    temperature: rand.temperature,
    maxTokens: MAX_TOKENS,
  };
}
