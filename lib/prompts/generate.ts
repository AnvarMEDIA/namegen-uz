import {
  type InspirationKey,
  type RandomnessKey,
  type StyleKey,
  PHONETIC_RULE,
  QUALITY_CRITERIA,
  RANDOMNESS,
  STYLE_LABELS,
  STYLE_RULES,
} from './styles.js';
import type { UzbekRoot } from '../inspiration/uzbek.js';

export interface GeneratePromptInput {
  readonly keywords: string;
  readonly style: StyleKey | undefined;
  readonly randomness: RandomnessKey | undefined;
  /** Selected inspiration corpus, or undefined for the legacy prompt. */
  readonly inspiration?: InspirationKey | undefined;
  /**
   * Roots sampled by the caller (typically 10–15 entries via pickRoots).
   * Required when `inspiration` is set; ignored otherwise. The caller owns
   * the random sampling so the prompt builder stays pure and deterministic
   * for a given input — required for snapshot tests and prompt caching.
   */
  readonly inspirationRoots?: readonly UzbekRoot[] | undefined;
}

export interface GeneratePrompt {
  readonly system: string;
  readonly user: string;
  readonly temperature: number;
  readonly maxTokens: number;
}

const DEFAULT_STYLE: StyleKey = 'auto';
const DEFAULT_RANDOMNESS: RandomnessKey = 'medium';
const MAX_TOKENS_BASE = 2000;
// When inspiration is enabled the model emits 3 extra meaning_* fields per
// name (24 strings × ~30 tokens ≈ 720 extra) — bump the cap so we don't
// truncate.
const MAX_TOKENS_INSPIRATION = 2600;

const SYSTEM_PROMPT =
  'You are a world-class brand naming consultant specialising in the Uzbek and Central Asian market. ' +
  'You have named 500+ successful brands. Your names are creative, distinctive, and market-ready. ' +
  'CRITICAL FORMAT RULES: names must contain ONLY Latin letters (a-z) and digits (0-9). ' +
  'NO Cyrillic. NO Arabic. NO underscores. NO hyphens. NO spaces. Length 3-12 characters. ' +
  'Respond with ONLY raw JSON — no markdown fences, no comments, no extra text whatsoever.';

function formatInspirationBlock(roots: readonly UzbekRoot[]): string {
  // Format: "- nur (нур) — UZ: yorug'lik | RU: луч, свет | EN: ray, light"
  // Both Cyrillic and trilingual glosses help the AI ground its meaning_*
  // outputs in the same language conventions the corpus uses.
  const lines = roots.map(
    (r) =>
      `- ${r.latin} (${r.cyrillic}) — UZ: ${r.meaning_uz} | RU: ${r.meaning_ru} | EN: ${r.meaning_en}`,
  );
  return (
    'INSPIRATION (Uzbek modern roots): leverage authentic Uzbek semantics for this brand. ' +
    'Below are curated roots from the Uzbek inspiration corpus. ' +
    'Pick 1-2 whose meaning best fits the niche, then craft brand names that EVOKE or EXTEND those roots. ' +
    'The roots themselves may be 2..10 chars — they are SEMANTIC ANCHORS, not direct brand candidates. ' +
    'Final brand names MUST still match /^[a-z0-9]+$/ length 3-12.\n\n' +
    'ROOTS:\n' +
    lines.join('\n') +
    '\n\n' +
    'For EACH of the 8 generated names, also include three short explanations of the semantic origin ' +
    '(WHY the name works, not what the brand sells):\n' +
    "- meaning_uz: 1 sentence in Latin-script Uzbek (no full-stop)\n" +
    "- meaning_ru: same in Russian\n" +
    "- meaning_en: same in English\n" +
    'Example: meaning_en "rooted in nur (light) — clarity and direction for users".'
  );
}

export function buildGeneratePrompt(input: GeneratePromptInput): GeneratePrompt {
  const style = input.style ?? DEFAULT_STYLE;
  const randomness = input.randomness ?? DEFAULT_RANDOMNESS;
  const useInspiration =
    input.inspiration !== undefined &&
    input.inspirationRoots !== undefined &&
    input.inspirationRoots.length > 0;

  const styleLabel = STYLE_LABELS[style];
  const styleRules = STYLE_RULES[style];
  const rand = RANDOMNESS[randomness];

  const inspirationBlock = useInspiration
    ? '\n\n' + formatInspirationBlock(input.inspirationRoots!)
    : '';

  const jsonShape = useInspiration
    ? '{"names":[{"name":"nurli","tagline_ru":"Свет в каждом шаге","tagline_uz":"Har qadamda nur",' +
      '"meaning_uz":"nur ildiziga asoslangan","meaning_ru":"основано на корне нур (свет)",' +
      '"meaning_en":"rooted in nur (light)"},...]}'
    : '{"names":[{"name":"nurli","tagline_ru":"Свет в каждом шаге","tagline_uz":"Har qadamda nur"},...]}';

  const user =
    `Generate 8 high-quality brand names for the niche: "${input.keywords}"\n\n` +
    `Creativity level: ${rand.hint}\n\n` +
    `Style: ${styleLabel}\nStyle-specific rules: ${styleRules}` +
    inspirationBlock +
    `\n\n${PHONETIC_RULE}\n\n` +
    `${QUALITY_CRITERIA}\n\n` +
    `STRICT: the "name" field must match /^[a-z0-9]+$/ — all lowercase.\n` +
    `For each name write:\n` +
    `- tagline_ru: punchy 3-7 word Russian slogan (no full-stop), evokes emotion or value\n` +
    `- tagline_uz: same idea in Latin-script Uzbek (3-7 words, no full-stop)\n\n` +
    `Return ONLY valid JSON:\n` +
    `${jsonShape}\n` +
    `Exactly 8 items. All names must be DIFFERENT from each other.`;

  return {
    system: SYSTEM_PROMPT,
    user,
    temperature: rand.temperature,
    maxTokens: useInspiration ? MAX_TOKENS_INSPIRATION : MAX_TOKENS_BASE,
  };
}
