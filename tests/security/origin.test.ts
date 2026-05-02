import { describe, expect, it } from 'vitest';
import { isOriginAllowed } from '../../lib/security/origin.js';

describe('isOriginAllowed', () => {
  it('allows empty Origin (direct calls / curl)', () => {
    expect(isOriginAllowed('')).toBe(true);
  });

  it('allows the production hosts over HTTPS', () => {
    expect(isOriginAllowed('https://naming.maze.uz')).toBe(true);
    expect(isOriginAllowed('https://maze.uz')).toBe(true);
  });

  it('allows Vercel preview domains over HTTPS', () => {
    expect(isOriginAllowed('https://naming-maze-uz-git-foo-anvarmedia.vercel.app')).toBe(true);
    expect(isOriginAllowed('https://abc-123.vercel.app')).toBe(true);
  });

  it('allows localhost / 127.0.0.1 with or without port, http or https', () => {
    expect(isOriginAllowed('http://localhost')).toBe(true);
    expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    expect(isOriginAllowed('https://localhost:5173')).toBe(true);
    expect(isOriginAllowed('http://127.0.0.1:8080')).toBe(true);
  });

  it('rejects unrelated domains', () => {
    expect(isOriginAllowed('https://evil.com')).toBe(false);
    expect(isOriginAllowed('https://maze.uz.evil.com')).toBe(false);
    expect(isOriginAllowed('https://fake-maze.uz')).toBe(false);
  });

  it('rejects production hosts served over plain HTTP', () => {
    expect(isOriginAllowed('http://naming.maze.uz')).toBe(false);
    expect(isOriginAllowed('http://maze.uz')).toBe(false);
  });

  it('rejects sub-paths or trailing junk in Origin', () => {
    expect(isOriginAllowed('https://naming.maze.uz/')).toBe(false);
    expect(isOriginAllowed('https://naming.maze.uz/path')).toBe(false);
    expect(isOriginAllowed(' https://naming.maze.uz')).toBe(false);
  });
});
