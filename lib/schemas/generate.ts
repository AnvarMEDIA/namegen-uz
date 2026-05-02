import { z } from 'zod';

export const aiNameSchema = z.object({
  name: z.string(),
  tagline_ru: z.string().optional(),
  tagline_uz: z.string().optional(),
  tagline: z.string().optional(),
});

export const aiNamesResponseSchema = z.object({
  names: z.array(aiNameSchema),
});

export type AiName = z.infer<typeof aiNameSchema>;

export interface NormalisedName {
  name: string;
  tagline_ru: string;
  tagline_uz: string;
}

export function normaliseNames(input: unknown): NormalisedName[] {
  const parsed = aiNamesResponseSchema.safeParse(input);
  if (!parsed.success) return [];

  const seen = new Set<string>();
  const out: NormalisedName[] = [];

  for (const raw of parsed.data.names) {
    if (!raw.name) continue;
    const name = raw.name.toLowerCase();
    if (!isValidName(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      name,
      tagline_ru: stripTrailingPunct(raw.tagline_ru ?? raw.tagline ?? ''),
      tagline_uz: stripTrailingPunct(raw.tagline_uz ?? ''),
    });
    if (out.length >= 8) break;
  }

  return out;
}

export function isValidName(name: string): boolean {
  if (!/^[a-z0-9]+$/.test(name)) return false;
  if (name.length < 4 || name.length > 12) return false;
  if (/(.)\1\1/.test(name)) return false;
  return true;
}

function stripTrailingPunct(s: string): string {
  return s.replace(/[.!?]+$/, '').trim();
}
