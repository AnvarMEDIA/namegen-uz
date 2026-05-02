import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AnthropicError, callAnthropic } from '../lib/anthropic/client';
import { MODELS } from '../lib/anthropic/models';
import { buildAnalysePrompt } from '../lib/prompts/analyse';
import { buildGeneratePrompt } from '../lib/prompts/generate';
import { isRandomnessKey, isStyleKey, type RandomnessKey, type StyleKey } from '../lib/prompts/styles';
import { normaliseNames } from '../lib/schemas/generate';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY не задан' });
    return;
  }

  const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Record<string, unknown>;
  const mode = typeof body['mode'] === 'string' ? body['mode'] : 'generate';

  try {
    if (mode === 'analyse') {
      await handleAnalyse(body, apiKey, res);
      return;
    }
    await handleGenerate(body, apiKey, res);
  } catch (err) {
    if (err instanceof AnthropicError) {
      res.status(err.status >= 500 ? err.status : 502).json({
        error: err.message,
        ...(err.bodyExcerpt ? { detail: err.bodyExcerpt } : {}),
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'unknown error';
    res.status(500).json({ error: message });
  }
}

async function handleAnalyse(
  body: Record<string, unknown>,
  apiKey: string,
  res: VercelResponse,
): Promise<void> {
  const name = typeof body['name'] === 'string' ? body['name'] : '';
  if (!name.trim()) {
    res.status(400).json({ error: 'name обязателен' });
    return;
  }

  const built = buildAnalysePrompt({ name });
  const result = await callAnthropic({
    apiKey,
    model: MODELS.analyse,
    system: built.system,
    messages: [{ role: 'user', content: built.user }],
    maxTokens: 1200,
    temperature: built.temperature,
  });

  try {
    const parsed = JSON.parse(result.text) as unknown;
    res.status(200).json(parsed);
  } catch {
    res.status(500).json({ error: 'Невалидный JSON от AI', raw: result.text.slice(0, 200) });
  }
}

async function handleGenerate(
  body: Record<string, unknown>,
  apiKey: string,
  res: VercelResponse,
): Promise<void> {
  const keywordsRaw = typeof body['keywords'] === 'string' ? body['keywords'] : '';
  if (!keywordsRaw.trim()) {
    res.status(400).json({ error: 'keywords обязателен' });
    return;
  }

  const styleRaw = typeof body['style'] === 'string' ? body['style'] : 'auto';
  const randomnessRaw = typeof body['randomness'] === 'string' ? body['randomness'] : 'medium';
  const style: StyleKey = isStyleKey(styleRaw) ? styleRaw : 'auto';
  const randomness: RandomnessKey = isRandomnessKey(randomnessRaw) ? randomnessRaw : 'medium';

  const built = buildGeneratePrompt({ keywords: keywordsRaw, style, randomness });
  const result = await callAnthropic({
    apiKey,
    model: MODELS.generate,
    system: built.system,
    messages: [{ role: 'user', content: built.user }],
    maxTokens: 2000,
    temperature: built.temperature,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    res.status(500).json({ error: 'Невалидный JSON от API', raw: result.text.slice(0, 200) });
    return;
  }

  const names = normaliseNames(parsed);
  if (names.length === 0) {
    res.status(500).json({ error: 'Нет валидных имён в ответе' });
    return;
  }

  res.status(200).json({ names });
}
