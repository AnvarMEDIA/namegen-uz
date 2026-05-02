import { ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION } from './models';

export interface AnthropicMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export interface AnthropicRequest {
  readonly model: string;
  readonly max_tokens: number;
  readonly temperature?: number;
  readonly system: string;
  readonly messages: readonly AnthropicMessage[];
}

export interface AnthropicContentBlock {
  readonly type: string;
  readonly text?: string;
}

export interface AnthropicSuccessResponse {
  readonly content: readonly AnthropicContentBlock[];
}

export class AnthropicError extends Error {
  override readonly name = 'AnthropicError';
  readonly status: number;
  readonly body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface CallAnthropicOptions {
  readonly apiKey: string;
  readonly request: AnthropicRequest;
  /** Default 4. Each retry triggered only by 429/529 responses. */
  readonly maxAttempts?: number;
  /** Sleep override for tests. Defaults to setTimeout. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** Fetch override for tests. Defaults to global fetch. */
  readonly fetch?: typeof fetch;
}

const DEFAULT_SLEEP = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Calls Anthropic Messages API with retry/backoff for 429 (12s) and 529 (5s).
 * Mirrors the retry policy already in production api/generate.js.
 */
export async function callAnthropic(
  opts: CallAnthropicOptions,
): Promise<AnthropicSuccessResponse> {
  const sleep = opts.sleep ?? DEFAULT_SLEEP;
  const doFetch = opts.fetch ?? fetch;
  const maxAttempts = opts.maxAttempts ?? 4;

  let attemptsLeft = maxAttempts;
  while (attemptsLeft > 0) {
    const resp = await doFetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': opts.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(opts.request),
    });

    if (resp.status === 429 || resp.status === 529) {
      attemptsLeft--;
      if (attemptsLeft <= 0) {
        throw new AnthropicError('rate-limited or overloaded', resp.status, '');
      }
      const wait = resp.status === 429 ? 12_000 : 5_000;
      await sleep(wait);
      continue;
    }

    if (!resp.ok) {
      const text = await resp.text();
      throw new AnthropicError(`API ${resp.status}`, resp.status, text.slice(0, 300));
    }

    return (await resp.json()) as AnthropicSuccessResponse;
  }

  throw new AnthropicError('rate-limited or overloaded', 503, '');
}

/** Strips ```json fences and trims, mirroring api/generate.js raw-response cleanup. */
export function extractText(response: AnthropicSuccessResponse): string {
  const block = response.content[0];
  const text = block?.text ?? '';
  return text.replace(/```json|```/g, '').trim();
}
