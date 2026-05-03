import { z } from 'zod';
import { INSPIRATION_KEYS, RANDOMNESS_KEYS, STYLE_KEYS } from '../prompts/styles.js';

const CONTROL_CHARS_RE = /[\x00-\x1F\x7F]+/g;

/**
 * Strips control characters (NUL, CR, LF, tab, …) — main vector for
 * prompt-injection breakouts via fake "system" lines. Mirrors
 * api/generate.js sanitiseUserText().
 */
export function sanitiseUserText(value: string): string {
  return value.replace(CONTROL_CHARS_RE, ' ').trim();
}

const KEYWORDS_MAX = 200;
const NAME_MAX = 40;

export const GenerateBodySchema = z
  .object({
    keywords: z
      .string({ required_error: 'keywords обязателен' })
      .transform((v) => sanitiseUserText(v).slice(0, KEYWORDS_MAX)),
    style: z.enum(STYLE_KEYS).optional(),
    randomness: z.enum(RANDOMNESS_KEYS).optional(),
    inspiration: z.enum(INSPIRATION_KEYS).optional(),
  })
  .refine((v) => v.keywords.length > 0, {
    path: ['keywords'],
    message: 'keywords обязателен',
  });

export type GenerateBody = z.infer<typeof GenerateBodySchema>;

export const AnalyseBodySchema = z
  .object({
    mode: z.literal('analyse'),
    name: z
      .string({ required_error: 'name должен быть строкой' })
      .transform((v) => sanitiseUserText(v).slice(0, NAME_MAX)),
  })
  .refine((v) => v.name.length > 0, {
    path: ['name'],
    message: 'name недопустим',
  });

export type AnalyseBody = z.infer<typeof AnalyseBodySchema>;

const NameItemSchema = z.object({
  name: z.string(),
  tagline_ru: z.string().optional(),
  tagline_uz: z.string().optional(),
  tagline: z.string().optional(),
  // Returned only when the request used inspiration='uzbek_modern' — the
  // model fills these with a 1-sentence "why this name works" rationale
  // tied to the Uzbek root that anchored it. Optional so legacy /api
  // payloads without inspiration keep validating.
  meaning_uz: z.string().optional(),
  meaning_ru: z.string().optional(),
  meaning_en: z.string().optional(),
});

export const AiGenerateResponseSchema = z.object({
  names: z.array(NameItemSchema).optional(),
});

export type AiGenerateResponse = z.infer<typeof AiGenerateResponseSchema>;

export interface NormalisedName {
  readonly name: string;
  readonly tagline_ru: string;
  readonly tagline_uz: string;
  /** Set only when the AI returned a non-empty meaning rationale. */
  readonly meaning_uz?: string;
  readonly meaning_ru?: string;
  readonly meaning_en?: string;
}

const NAME_RE = /^[a-z0-9]+$/;
const TRIPLE_REPEAT_RE = /(.)\1\1/;
const TRAILING_PUNCT_RE = /[.!?]+$/;
const NAME_MIN_LEN = 4;
const NAME_MAX_LEN = 12;
const RESULT_CAP = 8;

/**
 * Cleaned-name validator — same rules as api/generate.js inner filter:
 * lowercase Latin/digits only, length 4..12, no triple-repeats.
 */
export function isValidName(value: string): boolean {
  if (!NAME_RE.test(value)) return false;
  if (value.length < NAME_MIN_LEN || value.length > NAME_MAX_LEN) return false;
  if (TRIPLE_REPEAT_RE.test(value)) return false;
  return true;
}

/**
 * Normalises an AI-shaped object into clean unique results capped at 8.
 * Lowercases, dedupes, drops invalid names, falls back to legacy `tagline`
 * field when `tagline_ru` is missing. Mirrors the post-processing pipeline
 * already in api/generate.js.
 */
export function normaliseNames(input: unknown): NormalisedName[] {
  const parsed = AiGenerateResponseSchema.safeParse(input);
  if (!parsed.success) return [];
  const items = parsed.data.names ?? [];

  const cleaned: NormalisedName[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    const lower = item.name.toLowerCase();
    if (!isValidName(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    const muz = (item.meaning_uz ?? '').trim();
    const mru = (item.meaning_ru ?? '').trim();
    const men = (item.meaning_en ?? '').trim();
    cleaned.push({
      name: lower,
      tagline_ru: (item.tagline_ru ?? item.tagline ?? '')
        .replace(TRAILING_PUNCT_RE, '')
        .trim(),
      tagline_uz: (item.tagline_uz ?? '').replace(TRAILING_PUNCT_RE, '').trim(),
      // Spread-conditional so absent meaning_* never materialise as
      // explicit `undefined` (exactOptionalPropertyTypes guards on this).
      ...(muz ? { meaning_uz: muz } : {}),
      ...(mru ? { meaning_ru: mru } : {}),
      ...(men ? { meaning_en: men } : {}),
    });
    if (cleaned.length >= RESULT_CAP) break;
  }

  return cleaned;
}
