require('dotenv').config();
const express = require('express');
const path = require('path');

const generate = require('./api/generate.js');
const checkUz  = require('./api/check-uz/[name].js');
const checkTg  = require('./api/check-tg/[name].js');
const checkIg  = require('./api/check-ig/[name].js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname, { index: false, extensions: ['html'] }));

const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.post('/api/generate', wrap(generate));
app.get('/api/check-uz/:name', wrap((req, res) => { req.query.name = req.params.name; return checkUz(req, res); }));
app.get('/api/check-tg/:name', wrap((req, res) => { req.query.name = req.params.name; return checkTg(req, res); }));
app.get('/api/check-ig/:name', wrap((req, res) => { req.query.name = req.params.name; return checkIg(req, res); }));

app.get('/name/:name', (_req, res) => res.sendFile(path.join(__dirname, 'name.html')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`naming.maze.uz dev: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY не задан в .env');
  }
});
