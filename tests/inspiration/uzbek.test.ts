import { describe, expect, it } from 'vitest';
import {
  UZBEK_CATEGORIES,
  UZBEK_ROOTS,
  getRootsByCategory,
  pickRoots,
} from '../../lib/inspiration/uzbek.js';

// HARD invariants that lock in the curated-corpus contract — any commit
// that breaks one of these fails CI before reaching a preview deploy.

describe('Uzbek inspiration dictionary — HARD guards', () => {
  it('every latin field matches the documented charset /^[a-z\'ʻ`]+$/', () => {
    const charsetRe = /^[a-z'ʻ`]+$/;
    for (const root of UZBEK_ROOTS) {
      expect(charsetRe.test(root.latin), `latin "${root.latin}" violates charset`).toBe(true);
    }
  });

  it('cyrillic field is never empty and never contains Latin a-z', () => {
    const latinRe = /[a-zA-Z]/;
    for (const root of UZBEK_ROOTS) {
      expect(root.cyrillic).not.toBe('');
      expect(latinRe.test(root.cyrillic), `cyrillic "${root.cyrillic}" leaks Latin`).toBe(false);
    }
  });

  it('all 8 documented categories are present in the corpus', () => {
    const present = new Set(UZBEK_ROOTS.map((r) => r.category));
    for (const cat of UZBEK_CATEGORIES) {
      expect(present.has(cat), `category "${cat}" missing from corpus`).toBe(true);
    }
    expect(present.size).toBe(UZBEK_CATEGORIES.length);
  });

  it('every entry has all six required fields with non-empty strings', () => {
    for (const root of UZBEK_ROOTS) {
      expect(root.latin, `latin missing: ${JSON.stringify(root)}`).toBeTruthy();
      expect(root.cyrillic).toBeTruthy();
      expect(root.meaning_uz).toBeTruthy();
      expect(root.meaning_ru).toBeTruthy();
      expect(root.meaning_en).toBeTruthy();
      expect(root.category).toBeTruthy();
    }
  });

  it('every category value is in the documented union', () => {
    const validCategories = new Set<string>(UZBEK_CATEGORIES);
    for (const root of UZBEK_ROOTS) {
      expect(
        validCategories.has(root.category),
        `entry "${root.latin}" has unknown category "${root.category}"`,
      ).toBe(true);
    }
  });

  it('no duplicate latin values (post-olov-fix invariant)', () => {
    const seen = new Map<string, number>();
    for (const root of UZBEK_ROOTS) {
      seen.set(root.latin, (seen.get(root.latin) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, count]) => count > 1);
    expect(duplicates).toEqual([]);
  });
});

// SOFT warnings — surface drift from the conventional inspiration range
// without failing the suite. Floor sanity check ensures the corpus has
// at least SOME entries inside the conventional range.

describe('Uzbek inspiration dictionary — SOFT warnings', () => {
  it('warns about entries outside length 3-10 without failing', () => {
    const outOfRange = UZBEK_ROOTS.filter((r) => r.latin.length < 3 || r.latin.length > 10);
    if (outOfRange.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[uzbek dictionary soft] ${outOfRange.length} entries outside length 3-10:`,
        outOfRange.map((r) => `${r.latin}(${r.latin.length})`).join(', '),
      );
    }
    // Sanity floor: most entries should be inside the conventional band.
    expect(outOfRange.length).toBeLessThan(UZBEK_ROOTS.length);
  });
});

describe('getRootsByCategory', () => {
  it('returns only roots from the requested category', () => {
    for (const cat of UZBEK_CATEGORIES) {
      const roots = getRootsByCategory(cat);
      expect(roots.length, `category ${cat} unexpectedly empty`).toBeGreaterThan(0);
      for (const r of roots) {
        expect(r.category).toBe(cat);
      }
    }
  });

  it('count matches a direct UZBEK_ROOTS filter', () => {
    const fromHelper = getRootsByCategory('emotion');
    const fromFilter = UZBEK_ROOTS.filter((r) => r.category === 'emotion');
    expect(fromHelper.length).toBe(fromFilter.length);
  });
});

describe('pickRoots', () => {
  function makeSeededRng(seed: number): () => number {
    // mulberry32 — small, deterministic, fast.
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it('returns exactly `count` entries when corpus has enough', () => {
    expect(pickRoots({ count: 10 }).length).toBe(10);
    expect(pickRoots({ count: 1 }).length).toBe(1);
    expect(pickRoots({ count: 0 }).length).toBe(0);
  });

  it('caps at corpus size when count exceeds total', () => {
    const result = pickRoots({ count: 100_000 });
    expect(result.length).toBe(UZBEK_ROOTS.length);
  });

  it('respects the category filter', () => {
    const result = pickRoots({ categories: ['nature'], count: 5 });
    expect(result.length).toBe(5);
    for (const r of result) {
      expect(r.category).toBe('nature');
    }
  });

  it('returns deterministic results when given a seeded rng', () => {
    const a = pickRoots({ count: 8, rng: makeSeededRng(42) });
    const b = pickRoots({ count: 8, rng: makeSeededRng(42) });
    expect(a.map((r) => r.latin)).toEqual(b.map((r) => r.latin));
  });

  it('handles negative count as zero (no throw)', () => {
    expect(pickRoots({ count: -5 }).length).toBe(0);
  });
});
