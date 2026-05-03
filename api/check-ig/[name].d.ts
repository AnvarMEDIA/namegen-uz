import type { VercelRequest, VercelResponse } from '@vercel/node';

declare const handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
export default handler;

// Test-only exports — the .js file lists these on the __test__ object so
// unit tests can verify the building blocks (markers, retry, classification)
// in isolation.
export const __test__: {
  readonly PER_SOURCE_TIMEOUT_MS: number;
  readonly MAX_ATTEMPTS_PER_SOURCE: number;
  readonly BACKOFF_MS: readonly number[];
  readonly MAX_RETRY_AFTER_MS: number;
  readonly NOT_FOUND_MARKERS: readonly string[];
  readonly LOGIN_WALL_MARKERS: readonly string[];
  readonly PROFILE_MARKERS: readonly string[];
  readonly parseRetryAfter: (headerValue: string | null) => number | null;
  readonly classifyHtml: (html: string, name: string) => 'free' | 'taken' | null;
};
