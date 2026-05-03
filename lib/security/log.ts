// Structured security log — surfaces in Vercel function logs, grep-able by [SEC].
// Never include raw user input or secrets — only IP, origin, and event type.
//
// Output format matches the production api/generate.js logSec() exactly so
// existing log-aggregation queries keep working.
export function logSecurityEvent(event: string, extra?: Record<string, unknown>): void {
  try {
    const payload = JSON.stringify({ event, ts: Date.now(), ...(extra ?? {}) });
    console.warn('[SEC] ' + payload);
  } catch {
    // never throw from logger
  }
}
