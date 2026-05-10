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
}

// Stage 1 stub — the real implementation lands in Stage 5 (analytics dashboard)
// with filtering, pagination, and time-series rollups. Kept here so the admin
// shell can render an empty events table without 404'ing.
export async function handle(req: RequestLike, res: ResponseLike): Promise<unknown> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  res.setHeader('Cache-Control', 'no-store');
  const email = requireAdmin(req);
  if (!email) return res.status(401).json({ error: 'Unauthorized' });
  return res.status(200).json({ events: [], total: 0 });
}

export default function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<unknown> {
  return handle(req, res);
}
