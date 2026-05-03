import type { VercelRequest, VercelResponse } from '@vercel/node';

declare const handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
export default handler;

// Test-only exports — mirrors check-ig/[name].d.ts.
export const __test__: {
  readonly PER_SOURCE_TIMEOUT_MS: number;
  readonly MAX_ATTEMPTS_PER_SOURCE: number;
  readonly BACKOFF_MS: readonly number[];
  readonly MAX_RETRY_AFTER_MS: number;
  readonly NOT_FOUND_MARKERS: readonly string[];
  readonly PROFILE_MARKERS: readonly string[];
  readonly parseRetryAfter: (headerValue: string | null) => number | null;
  readonly parseFinalUrl: (url: string) => { hostname: string; pathname: string };
  readonly classifyHtml: (html: string, name: string) => 'free' | 'taken' | null;
};
