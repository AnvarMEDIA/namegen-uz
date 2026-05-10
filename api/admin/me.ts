import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requireAdmin } from '../../lib/auth/middleware.js';

export interface RequestLike {
  method?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  setHeader(name: string, value: string): unknown;
  json(body: unknown): unknown;
  end(): unknown;
}

export async function handle(req: RequestLike, res: ResponseLike): Promise<unknown> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  // Admin endpoints must never be cached by browsers or upstream proxies.
  res.setHeader('Cache-Control', 'no-store');
  const email = requireAdmin(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json({ email });
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  return handle(req, res);
}
