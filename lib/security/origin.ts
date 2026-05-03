// Origin allow-list — same domains as the production api/generate.js.
//
//   - https://naming.maze.uz, https://maze.uz   → production
//   - https://*.vercel.app                       → Vercel preview deployments
//   - http(s)://localhost(:port), 127.0.0.1     → local dev
//   - empty Origin                               → direct call (curl etc.) — allowed
//                                                  but rate-limit still applies upstream.
const ALLOWED_HOST_RE = /^https:\/\/(naming\.maze\.uz|maze\.uz|[a-z0-9-]+\.vercel\.app)$/;
const ALLOWED_DEV_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export function isOriginAllowed(origin: string): boolean {
  if (!origin) return true;
  return ALLOWED_HOST_RE.test(origin) || ALLOWED_DEV_RE.test(origin);
}
