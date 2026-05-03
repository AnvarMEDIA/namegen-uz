import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetRateLimitForTest,
  checkRateLimit,
  RATE_LIMIT_CONFIG,
} from '../../lib/security/rate-limit.js';

describe('checkRateLimit', () => {
  beforeEach(() => {
    __resetRateLimitForTest();
  });

  it('exposes the production-pinned config (10 / 60s)', () => {
    expect(RATE_LIMIT_CONFIG).toEqual({ windowMs: 60_000, maxPerWindow: 10 });
  });

  it('allows up to maxPerWindow requests inside the window', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      expect(checkRateLimit('1.1.1.1', { now })).toBe(true);
    }
  });

  it('blocks the (max+1)th request inside the window', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkRateLimit('1.1.1.1', { now });
    }
    expect(checkRateLimit('1.1.1.1', { now })).toBe(false);
  });

  it('lets the same IP through again after the window expires', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkRateLimit('1.1.1.1', { now: t0 });
    }
    expect(checkRateLimit('1.1.1.1', { now: t0 })).toBe(false);
    const afterWindow = t0 + RATE_LIMIT_CONFIG.windowMs + 1;
    expect(checkRateLimit('1.1.1.1', { now: afterWindow })).toBe(true);
  });

  it('tracks IPs independently', () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_CONFIG.maxPerWindow; i++) {
      checkRateLimit('1.1.1.1', { now });
    }
    expect(checkRateLimit('1.1.1.1', { now })).toBe(false);
    expect(checkRateLimit('2.2.2.2', { now })).toBe(true);
  });
});
