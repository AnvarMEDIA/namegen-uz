import type { VercelRequest, VercelResponse } from '@vercel/node';

import { AnthropicError, callAnthropic, extractText } from '../lib/anthropic/client.js';
import { MODELS } from '../lib/anthropic/models.js';
import { buildAnalysePrompt } from '../lib/prompts/analyse.js';
import { buildGeneratePrompt } from '../lib/prompts/generate.js';
import {
  isModeKey,
  isRandomnessKey,
  isStyleKey,
  type RandomnessKey,
  type StyleKey,
} from '../lib/prompts/styles.js';
import { normaliseNames, sanitiseUserText } from '../lib/schemas/generate.js';
import { logSecurityEvent } from '../lib/security/log.js';
import { isOriginAllowed } from '../lib/security/origin.js';
import { checkRateLimit } from '../lib/security/rate-limit.js';

// ── Minimal request/response shape so the handler can be tested with plain
// objects without depending on @vercel/node runtime internals. VercelRequest
// and VercelResponse are structural supersets of these.
export interface RequestLike {
  method?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
  setHeader(name: string, value: string): unknown;
  end(): unknown;
}

const KEYWORDS_MAX = 200;
const NAME_MAX = 40;

type ValidatedBody =
  | { ok: true; mode: 'analyse'; name: string }
  | {
      ok: true;
      mode: 'generate';
      keywords: string;
      style: StyleKey | undefined;
      randomness: RandomnessKey | undefined;
    }
  | { ok: false; msg: string };

function pickHeader(req: RequestLike, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) return value[0];
  return value;
}

function pickIp(req: RequestLike): string {
  const raw = pickHeader(req, 'x-forwarded-for') ?? pickHeader(req, 'x-real-ip') ?? '';
  const first = raw.split(',')[0]?.trim();
  return first && first.length > 0 ? first : 'unknown';
}

// Mirrors api/generate.js validateBody() 1:1 — same error strings, same order
// of checks (mode → style → randomness → mode-specific). Strict enum guards
// from lib/prompts/styles.ts replace the in-file ENUM Sets.
function validateBody(body: unknown): ValidatedBody {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, msg: 'тело запроса должно быть объектом' };
  }
  const b = body as Record<string, unknown>;
  const rawMode = b['mode'];
  const rawStyle = b['style'];
  const rawRandomness = b['randomness'];

  if (rawMode !== undefined && !isModeKey(rawMode)) {
    return { ok: false, msg: 'mode недопустим' };
  }
  if (rawStyle !== undefined && !isStyleKey(rawStyle)) {
    return { ok: false, msg: 'style недопустим' };
  }
  if (rawRandomness !== undefined && !isRandomnessKey(rawRandomness)) {
    return { ok: false, msg: 'randomness недопустим' };
  }

  if (rawMode === 'analyse') {
    const name = b['name'];
    if (typeof name !== 'string') return { ok: false, msg: 'name должен быть строкой' };
    const safe = sanitiseUserText(name).slice(0, NAME_MAX);
    if (!safe) return { ok: false, msg: 'name недопустим' };
    return { ok: true, mode: 'analyse', name: safe };
  }

  const keywords = b['keywords'];
  if (typeof keywords !== 'string') {
    return { ok: false, msg: 'keywords должен быть строкой' };
  }
  const safe = sanitiseUserText(keywords).slice(0, KEYWORDS_MAX);
  if (!safe) return { ok: false, msg: 'keywords обязателен' };

  return {
    ok: true,
    mode: 'generate',
    keywords: safe,
    style: isStyleKey(rawStyle) ? rawStyle : undefined,
    randomness: isRandomnessKey(rawRandomness) ? rawRandomness : undefined,
  };
}

async function runAnalyse(
  res: ResponseLike,
  apiKey: string,
  name: string,
): Promise<unknown> {
  const prompt = buildAnalysePrompt({ name });
  try {
    const response = await callAnthropic({
      apiKey,
      request: {
        model: MODELS.analyse,
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      },
    });
    const text = extractText(response);
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res
        .status(500)
        .json({ error: 'Невалидный JSON от AI', raw: text.slice(0, 200) });
    }
  } catch (err) {
    if (err instanceof AnthropicError) {
      return res
        .status(err.status)
        .json({ error: `API ${err.status}: ${err.body.slice(0, 200)}` });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
}

async function runGenerate(
  res: ResponseLike,
  apiKey: string,
  keywords: string,
  style: StyleKey | undefined,
  randomness: RandomnessKey | undefined,
): Promise<unknown> {
  const prompt = buildGeneratePrompt({ keywords, style, randomness });
  try {
    const response = await callAnthropic({
      apiKey,
      request: {
        model: MODELS.generate,
        max_tokens: prompt.maxTokens,
        temperature: prompt.temperature,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      },
    });
    const text = extractText(response);
    if (!text) return res.status(500).json({ error: 'Пустой ответ от API' });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res
        .status(500)
        .json({ error: 'Невалидный JSON от API', raw: text.slice(0, 200) });
    }

    const names = normaliseNames(parsed);
    if (!names.length) return res.status(500).json({ error: 'Нет валидных имён в ответе' });

    return res.status(200).json({ names });
  } catch (err) {
    if (err instanceof AnthropicError) {
      if (err.status === 429 || err.status === 529) {
        return res.status(503).json({ error: 'API перегружен, попробуйте позже' });
      }
      return res
        .status(err.status)
        .json({ error: `Anthropic API ${err.status}: ${err.body.slice(0, 300)}` });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
}

/** Exported for tests — accepts plain RequestLike/ResponseLike objects. */
export async function handle(req: RequestLike, res: ResponseLike): Promise<unknown> {
  // ── Origin allow-list ──────────────────────────────────
  const origin = pickHeader(req, 'origin') ?? '';
  if (!isOriginAllowed(origin)) {
    logSecurityEvent('origin_blocked', { origin });
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  // ── Method ─────────────────────────────────────────────
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── Per-IP rate-limit ──────────────────────────────────
  const ip = pickIp(req);
  if (!checkRateLimit(ip)) {
    logSecurityEvent('rate_limited', { ip });
    res.setHeader('Retry-After', '60');
    return res
      .status(429)
      .json({ error: 'Слишком много запросов. Попробуйте через минуту.' });
  }

  // ── Body parsing ───────────────────────────────────────
  let body: unknown;
  try {
    body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  } catch {
    logSecurityEvent('invalid_json', { ip });
    return res.status(400).json({ error: 'Невалидный JSON' });
  }

  // ── Strict enum validation + sanitisation ──────────────
  const v = validateBody(body);
  if (!v.ok) {
    logSecurityEvent('validation_failed', { ip, reason: v.msg });
    return res.status(400).json({ error: v.msg });
  }

  // ── ANTHROPIC_API_KEY ──────────────────────────────────
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY не задан' });
  }

  if (v.mode === 'analyse') {
    return runAnalyse(res, apiKey, v.name);
  }
  return runGenerate(res, apiKey, v.keywords, v.style, v.randomness);
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  return handle(req, res);
}
