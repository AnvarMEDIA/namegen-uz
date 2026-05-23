#!/usr/bin/env node
// Build OG share images (1200x630) for each locale.
// Renders SVG via @resvg/resvg-js with embedded Manrope.
//
// Run: node scripts/build-og-images.cjs
// Output: og/og-{ru,uz,en}.png  (served at https://naming.maze.uz/og/og-*.png)

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const FONT_DIR = path.join(__dirname, 'fonts');
const OUT_DIR = path.join(__dirname, '..', 'og');
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1200;
const H = 630;
const BG = '#0A0A0D';
const ACCENT = '#C4FF3F';
const TEXT = '#F2F2EE';
const MUTED = '#A0A0A6';
const HAIRLINE = 'rgba(255,255,255,0.06)';

const LOCALES = {
  ru: {
    eyebrow: 'AI · NAMING · TASHKENT',
    headline: ['AI-генератор', 'имён бренда'],
    subline: 'Первый на узбекском языке.',
    url: 'naming.maze.uz',
  },
  uz: {
    eyebrow: 'AI · NAMING · TOSHKENT',
    headline: ['AI brend nom', 'generatori'],
    subline: 'O’zbek tilidagi birinchi vosita.',
    url: 'naming.maze.uz',
  },
  en: {
    eyebrow: 'AI · NAMING · TASHKENT',
    headline: ['AI Brand Name', 'Generator'],
    subline: 'The first one in Uzbek language.',
    url: 'naming.maze.uz',
  },
};

function gridLines() {
  // 64px grid lines softly tinted to match site background
  const verticals = [];
  for (let x = 0; x <= W; x += 64) {
    verticals.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${HAIRLINE}" stroke-width="1"/>`);
  }
  const horizontals = [];
  for (let y = 0; y <= H; y += 64) {
    horizontals.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${HAIRLINE}" stroke-width="1"/>`);
  }
  return verticals.join('') + horizontals.join('');
}

function buildSVG(locale) {
  const L = LOCALES[locale];
  // Big lime "M" logo top-left
  // Eyebrow mono row under it
  // 2-line headline center-left
  // Subline below headline
  // URL bottom-left, accent pill bottom-right "naming.maze.uz"

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <g opacity="0.6">${gridLines()}</g>

  <!-- soft accent glow bottom-right -->
  <defs>
    <radialGradient id="glow" cx="85%" cy="95%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- logo MAZE/naming top-left -->
  <text x="72" y="120" font-family="Manrope" font-weight="800" font-size="40" fill="${TEXT}" letter-spacing="-1.5">MAZE</text>
  <text x="200" y="120" font-family="Manrope" font-weight="500" font-size="22" fill="${MUTED}">/ naming</text>

  <!-- eyebrow -->
  <text x="72" y="240" font-family="Manrope" font-weight="500" font-size="18" fill="${ACCENT}" letter-spacing="3">${escapeXml(L.eyebrow)}</text>

  <!-- headline (2 lines) -->
  <text x="72" y="340" font-family="Manrope" font-weight="800" font-size="78" fill="${TEXT}" letter-spacing="-3">${escapeXml(L.headline[0])}</text>
  <text x="72" y="425" font-family="Manrope" font-weight="800" font-size="78" fill="${TEXT}" letter-spacing="-3">${escapeXml(L.headline[1])}</text>

  <!-- subline -->
  <text x="72" y="490" font-family="Manrope" font-weight="500" font-size="26" fill="${MUTED}">${escapeXml(L.subline)}</text>

  <!-- url pill bottom-right -->
  <g transform="translate(${W - 72 - 360}, ${H - 80})">
    <rect width="360" height="56" rx="28" fill="${ACCENT}"/>
    <text x="180" y="36" font-family="Manrope" font-weight="800" font-size="22" fill="${BG}" text-anchor="middle" letter-spacing="0.5">${escapeXml(L.url)} →</text>
  </g>

  <!-- hairline border around card -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" fill="none" stroke="${HAIRLINE}" stroke-width="2"/>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function render(svg, outPath) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: {
      fontFiles: [
        path.join(FONT_DIR, 'Manrope-Medium.ttf'),
        path.join(FONT_DIR, 'Manrope-ExtraBold.ttf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Manrope',
    },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
  return png.length;
}

for (const locale of Object.keys(LOCALES)) {
  const svg = buildSVG(locale);
  const out = path.join(OUT_DIR, `og-${locale}.png`);
  const bytes = render(svg, out);
  console.log(`og-${locale}.png  ${(bytes / 1024).toFixed(1)} KB`);
}
