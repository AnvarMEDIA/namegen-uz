require('dotenv').config();
const express = require('express');
const path = require('path');

// /api/generate moved to api/generate.ts (TypeScript). Local Express dev
// can no longer require it directly — use `npm run vercel-dev` for the
// full /api stack including /api/generate.
//
// /api/check-{uz,tg,ig} are ESM .js modules (top-level "type": "module")
// so CJS server.cjs cannot synchronously require() them — use dynamic
// import(). Each promise resolves once at startup; per-request handlers
// just await the cached promise (cheap).
const checkUzPromise = import('./api/check-uz/[name].js').then((m) => m.default);
const checkTgPromise = import('./api/check-tg/[name].js').then((m) => m.default);
const checkIgPromise = import('./api/check-ig/[name].js').then((m) => m.default);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '4kb' }));

// JSON parse / payload errors → clean 400/413 instead of Express HTML stack traces
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large')   return res.status(413).json({ error: 'Payload too large' });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Невалидный JSON' });
  if (err) return res.status(400).json({ error: 'Bad request' });
  next();
});
app.use(express.static(__dirname, { index: false, extensions: ['html'] }));

const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.post('/api/generate', (_req, res) => res.status(501).json({
  error: 'Generate route is TypeScript-only. Run `npm run vercel-dev` instead of `npm run dev` to test it locally.',
}));
app.get('/api/check-uz/:name', wrap(async (req, res) => { const checkUz = await checkUzPromise; req.query.name = req.params.name; return checkUz(req, res); }));
app.get('/api/check-tg/:name', wrap(async (req, res) => { const checkTg = await checkTgPromise; req.query.name = req.params.name; return checkTg(req, res); }));
app.get('/api/check-ig/:name', wrap(async (req, res) => { const checkIg = await checkIgPromise; req.query.name = req.params.name; return checkIg(req, res); }));

app.get('/name/:name', (_req, res) => res.sendFile(path.join(__dirname, 'name.html')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`naming.maze.uz dev: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY не задан в .env');
  }
});
