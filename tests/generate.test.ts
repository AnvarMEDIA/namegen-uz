import { describe, expect, it } from 'vitest';
import { MODELS, ANTHROPIC_VERSION, ANTHROPIC_ENDPOINT } from '../lib/anthropic/models.js';
import { buildAnalysePrompt } from '../lib/prompts/analyse.js';
import { buildGeneratePrompt } from '../lib/prompts/generate.js';
import {
  isRandomnessKey,
  isStyleKey,
  RANDOMNESS,
  STYLE_LABELS,
  STYLE_RULES,
} from '../lib/prompts/styles.js';
import {
  AnalyseBodySchema,
  GenerateBodySchema,
  isValidName,
  normaliseNames,
  sanitiseUserText,
} from '../lib/schemas/generate.js';

describe('models registry', () => {
  it('pins the documented model IDs', () => {
    expect(MODELS.generate).toBe('claude-sonnet-4-6');
    expect(MODELS.analyse).toBe('claude-sonnet-4-6');
    expect(MODELS.connotation).toBe('claude-opus-4-7');
  });

  it('exposes the Anthropic API version and endpoint', () => {
    expect(ANTHROPIC_VERSION).toBe('2023-06-01');
    expect(ANTHROPIC_ENDPOINT).toBe('https://api.anthropic.com/v1/messages');
  });
});

describe('style and randomness type guards', () => {
  it('accepts every documented style key', () => {
    for (const key of Object.keys(STYLE_LABELS)) {
      expect(isStyleKey(key)).toBe(true);
    }
  });

  it('rejects unknown style keys', () => {
    expect(isStyleKey('UNKNOWN')).toBe(false);
    expect(isStyleKey('')).toBe(false);
    expect(isStyleKey(undefined)).toBe(false);
    expect(isStyleKey(42)).toBe(false);
  });

  it('accepts every documented randomness key', () => {
    for (const key of Object.keys(RANDOMNESS)) {
      expect(isRandomnessKey(key)).toBe(true);
    }
  });

  it('rejects unknown randomness keys', () => {
    expect(isRandomnessKey('extreme')).toBe(false);
    expect(isRandomnessKey(null)).toBe(false);
  });
});

describe('sanitiseUserText', () => {
  it('strips control characters and trims whitespace', () => {
    expect(sanitiseUserText('  hello\nworld\t  ')).toBe('hello world');
    expect(sanitiseUserText('a\x00b\x1fc')).toBe('a b c');
  });

  it('preserves printable Unicode like Cyrillic', () => {
    expect(sanitiseUserText('пекарня')).toBe('пекарня');
  });
});

describe('GenerateBodySchema', () => {
  it('accepts a minimal valid body (keywords only)', () => {
    const parsed = GenerateBodySchema.parse({ keywords: 'кофейня' });
    expect(parsed.keywords).toBe('кофейня');
    expect(parsed.style).toBeUndefined();
    expect(parsed.randomness).toBeUndefined();
  });

  it('accepts a full valid body and preserves enum values', () => {
    const parsed = GenerateBodySchema.parse({
      keywords: 'salon krasoty',
      style: 'brandable',
      randomness: 'high',
    });
    expect(parsed.style).toBe('brandable');
    expect(parsed.randomness).toBe('high');
  });

  it('truncates keywords to 200 characters and sanitises control chars', () => {
    const noisy = 'a\x07b'.padEnd(500, 'x');
    const parsed = GenerateBodySchema.parse({ keywords: noisy });
    expect(parsed.keywords.length).toBe(200);
    expect(parsed.keywords.startsWith('a b')).toBe(true);
  });

  it('rejects empty / whitespace-only keywords', () => {
    expect(GenerateBodySchema.safeParse({ keywords: '' }).success).toBe(false);
    expect(GenerateBodySchema.safeParse({ keywords: '   ' }).success).toBe(false);
  });

  it('rejects unknown style or randomness enum values', () => {
    expect(
      GenerateBodySchema.safeParse({ keywords: 'foo', style: 'mystery' }).success,
    ).toBe(false);
    expect(
      GenerateBodySchema.safeParse({ keywords: 'foo', randomness: 'extreme' }).success,
    ).toBe(false);
  });
});

describe('AnalyseBodySchema', () => {
  it('accepts a clean analyse body and trims/truncates the name to 40', () => {
    const parsed = AnalyseBodySchema.parse({
      mode: 'analyse',
      name: '   nurli\nbrand  '.padEnd(120, 'x'),
    });
    expect(parsed.mode).toBe('analyse');
    expect(parsed.name.length).toBeLessThanOrEqual(40);
    expect(parsed.name.startsWith('nurli brand')).toBe(true);
  });

  it('rejects bodies without the analyse literal', () => {
    expect(
      AnalyseBodySchema.safeParse({ mode: 'generate', name: 'nurli' }).success,
    ).toBe(false);
  });

  it('rejects empty names after sanitisation', () => {
    expect(
      AnalyseBodySchema.safeParse({ mode: 'analyse', name: '   \x00\x1f  ' }).success,
    ).toBe(false);
  });
});

describe('isValidName', () => {
  it('accepts a clean lowercase Latin name in the valid length range', () => {
    expect(isValidName('nurli')).toBe(true);
    expect(isValidName('aqlim')).toBe(true);
    expect(isValidName('sayyora')).toBe(true);
    expect(isValidName('nur24')).toBe(true);
  });

  it('rejects names that are too short or too long', () => {
    expect(isValidName('ab')).toBe(false);
    expect(isValidName('abc')).toBe(false);
    expect(isValidName('thisnameistoolong')).toBe(false);
  });

  it('rejects names with non a-z0-9 characters', () => {
    expect(isValidName('Nurli')).toBe(false);
    expect(isValidName('nur-li')).toBe(false);
    expect(isValidName('nur li')).toBe(false);
    expect(isValidName('нурли')).toBe(false);
    expect(isValidName('nurli!')).toBe(false);
  });

  it('rejects names with 3+ consecutive identical characters', () => {
    expect(isValidName('aaab')).toBe(false);
    expect(isValidName('nuuuur')).toBe(false);
  });
});

describe('normaliseNames', () => {
  it('lowercases, dedupes, drops invalid entries, and supports legacy tagline field', () => {
    const ai = {
      names: [
        { name: 'Nurli', tagline_ru: 'Свет в каждом шаге.', tagline_uz: 'Har qadamda nur' },
        { name: 'nurli', tagline_ru: 'duplicate', tagline_uz: '' },
        { name: 'ab', tagline_ru: 'too short', tagline_uz: '' },
        { name: 'baxtzor', tagline: 'legacy field', tagline_uz: '' },
      ],
    };
    const out = normaliseNames(ai);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({
      name: 'nurli',
      tagline_ru: 'Свет в каждом шаге',
      tagline_uz: 'Har qadamda nur',
    });
    expect(out[1]).toEqual({ name: 'baxtzor', tagline_ru: 'legacy field', tagline_uz: '' });
  });

  it('caps the result at 8 entries', () => {
    const names = Array.from({ length: 12 }, (_, i) => ({
      name: `brand${String.fromCharCode(97 + i)}`,
      tagline_ru: '',
      tagline_uz: '',
    }));
    expect(normaliseNames({ names }).length).toBe(8);
  });

  it('returns an empty array when the input is malformed', () => {
    expect(normaliseNames(null)).toEqual([]);
    expect(normaliseNames({})).toEqual([]);
    expect(normaliseNames({ names: 'oops' })).toEqual([]);
  });
});

describe('buildGeneratePrompt', () => {
  it('embeds keywords, randomness hint, style label, and style rules into the user message', () => {
    const prompt = buildGeneratePrompt({
      keywords: 'кофейня в Ташкенте',
      style: 'uzbek_roots',
      randomness: 'low',
    });
    expect(prompt.user).toContain('кофейня в Ташкенте');
    expect(prompt.user).toContain(RANDOMNESS.low.hint);
    expect(prompt.user).toContain(STYLE_LABELS.uzbek_roots);
    expect(prompt.user).toContain(STYLE_RULES.uzbek_roots);
    expect(prompt.user).toContain('Generate 8 high-quality brand names');
  });

  it('maps randomness to temperature (low=0.3, medium=0.8, high=1.0)', () => {
    expect(buildGeneratePrompt({ keywords: 'x', style: 'auto', randomness: 'low' }).temperature).toBe(
      0.3,
    );
    expect(
      buildGeneratePrompt({ keywords: 'x', style: 'auto', randomness: 'medium' }).temperature,
    ).toBe(0.8);
    expect(buildGeneratePrompt({ keywords: 'x', style: 'auto', randomness: 'high' }).temperature).toBe(
      1.0,
    );
  });

  it('defaults style to auto and randomness to medium when omitted', () => {
    const prompt = buildGeneratePrompt({
      keywords: 'fitness',
      style: undefined,
      randomness: undefined,
    });
    expect(prompt.temperature).toBe(0.8);
    expect(prompt.user).toContain(STYLE_LABELS.auto);
  });

  it('always returns the same JSON-only system prompt and 2000 max tokens', () => {
    const prompt = buildGeneratePrompt({
      keywords: 'x',
      style: 'auto',
      randomness: 'medium',
    });
    expect(prompt.system).toContain('Respond with ONLY raw JSON');
    expect(prompt.system).toContain('Latin letters (a-z) and digits (0-9)');
    expect(prompt.maxTokens).toBe(2000);
  });
});

describe('buildAnalysePrompt', () => {
  it('embeds the requested name into the user message and pins temperature 0.7 / 1200 tokens', () => {
    const prompt = buildAnalysePrompt({ name: 'nurli' });
    expect(prompt.user).toContain('"nurli"');
    expect(prompt.user).toContain('"meaning"');
    expect(prompt.user).toContain('"similar_brands"');
    expect(prompt.user).toContain('All values must be in Russian');
    expect(prompt.temperature).toBe(0.7);
    expect(prompt.maxTokens).toBe(1200);
  });

  it('uses the dedicated analyst system prompt', () => {
    expect(buildAnalysePrompt({ name: 'x' }).system).toContain('expert brand analyst');
  });
});
