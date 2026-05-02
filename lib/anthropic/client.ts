import { ANTHROPIC_ENDPOINT, ANTHROPIC_VERSION } from './models';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
}

export interface AnthropicSystemBlock {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface AnthropicCallInput {
  apiKey: string;
  model: string;
  system: string | AnthropicSystemBlock[];
  messages: AnthropicMessage[];
  maxTokens: number;
  temperature: number;
}

export interface AnthropicCallResult {
  text: string;
  raw: unknown;
}

export class AnthropicError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly bodyExcerpt?: string,
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

export async function callAnthropic(input: AnthropicCallInput): Promise<AnthropicCallResult> {
  const body = {
    model: input.model,
    max_tokens: input.maxTokens,
    temperature: input.temperature,
    system: input.system,
    messages: input.messages,
  };

  let attemptsLeft = 4;
  let lastStatus = 0;
  let lastBody = '';

  while (attemptsLeft > 0) {
    const resp = await fetch(ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': input.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (resp.status === 429 || resp.status === 529) {
      attemptsLeft--;
      lastStatus = resp.status;
      lastBody = await resp.text();
      if (attemptsLeft > 0) {
        const wait = resp.status === 429 ? 12000 : 5000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw new AnthropicError('API перегружен, попробуйте позже', 503, lastBody.slice(0, 200));
    }

    if (!resp.ok) {
      const text = await resp.text();
      throw new AnthropicError(
        `Anthropic API ${resp.status}`,
        resp.status,
        text.slice(0, 300),
      );
    }

    const data = (await resp.json()) as { content?: Array<{ text?: string }> };
    const text = (data.content?.[0]?.text ?? '').replace(/```json|```/g, '').trim();
    if (!text) {
      throw new AnthropicError('Пустой ответ от API', 500);
    }
    return { text, raw: data };
  }

  throw new AnthropicError('API перегружен, попробуйте позже', lastStatus || 503, lastBody.slice(0, 200));
}
