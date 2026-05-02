import { describe, expect, it } from 'vitest';
import { isValidName, normaliseNames } from '../lib/schemas/generate';

describe('isValidName', () => {
  it('accepts a clean lowercase Latin name in the valid length range', () => {
    expect(isValidName('nurli')).toBe(true);
    expect(isValidName('aqlim')).toBe(true);
    expect(isValidName('sayyora')).toBe(true);
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

  it('accepts numeric digits', () => {
    expect(isValidName('nur24')).toBe(true);
  });
});

describe('normaliseNames', () => {
  it('returns the cleaned and deduplicated list of valid names', () => {
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
    expect(out[0]).toEqual({ name: 'nurli', tagline_ru: 'Свет в каждом шаге', tagline_uz: 'Har qadamda nur' });
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
