import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// This test mirrors what Vercel's @vercel/node does to a TypeScript serverless
// function before invoking it: bundle the entry to ESM JavaScript via esbuild,
// then load the bundle through Node's native ESM resolver. If a relative
// import is missing its .js extension (the regression that caused
// FUNCTION_INVOCATION_FAILED on the May-02 preview deploy), the import will
// fail with ERR_MODULE_NOT_FOUND and this test will fail — even though the
// Vitest in-process tests would still pass because vite-node uses its own
// permissive resolver.
//
// esbuild is already in node_modules as a transitive dependency of
// @vercel/node + vitest, so no new toolchain dependency is added.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ESBUILD_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'esbuild');
const NODE_BIN = process.execPath;

interface BundleResult {
  outFile: string;
  workDir: string;
}

function bundleEntry(entry: string): BundleResult {
  // Output inside the repo so Node's ESM resolver can find node_modules/zod
  // — Vercel ships the function next to its node_modules, so this mirrors
  // the deployed layout. mkdtempSync gives a unique per-run dir to avoid
  // races between parallel test files.
  const baseDir = join(REPO_ROOT, '.smoke-build');
  mkdirSync(baseDir, { recursive: true });
  const workDir = mkdtempSync(join(baseDir, 'run-'));
  const outFile = join(workDir, 'bundle.mjs');
  const result = spawnSync(
    ESBUILD_BIN,
    [
      entry,
      '--bundle',
      '--format=esm',
      '--platform=node',
      '--target=node20',
      '--packages=external',
      `--outfile=${outFile}`,
    ],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    rmSync(workDir, { recursive: true, force: true });
    throw new Error(
      `esbuild failed (exit ${result.status}):\nSTDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
    );
  }
  return { outFile, workDir };
}

interface ImportResult {
  status: number;
  stdout: string;
  stderr: string;
}

function importBundle(outFile: string, assertScript: string): ImportResult {
  // Wrap the assertion in a try/catch that prints a stable JSON line to stdout
  // so the parent test can assert on shape without depending on log noise.
  const driver = `
    import('${outFile.replace(/\\/g, '\\\\')}')
      .then((m) => {
        ${assertScript}
        console.log('SMOKE_OK ' + JSON.stringify(Object.keys(m).sort()));
      })
      .catch((err) => {
        console.error('SMOKE_FAIL ' + (err && err.message ? err.message : String(err)));
        if (err && err.stack) console.error(err.stack);
        process.exit(2);
      });
  `;
  const writePath = outFile + '.driver.mjs';
  writeFileSync(writePath, driver);
  const result = spawnSync(NODE_BIN, [writePath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: 15_000,
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

describe('production runtime parity (esbuild bundle + Node ESM import)', () => {
  let bundle: BundleResult | undefined;

  beforeAll(() => {
    bundle = bundleEntry(join('api', 'generate.ts'));
  });

  afterAll(() => {
    if (bundle) rmSync(bundle.workDir, { recursive: true, force: true });
  });

  it('api/generate.ts bundles via esbuild and loads under native Node ESM', () => {
    expect(bundle).toBeDefined();
    const result = importBundle(
      bundle!.outFile,
      `
        if (typeof m.default !== 'function') {
          throw new Error('expected default export to be the Vercel handler');
        }
        if (typeof m.handle !== 'function') {
          throw new Error("expected named export handle for unit tests");
        }
      `,
    );
    if (result.status !== 0) {
      throw new Error(
        `Vercel-style runtime load failed (exit ${result.status}).\n` +
          `STDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
      );
    }
    expect(result.stdout).toContain('SMOKE_OK');
    expect(result.stdout).toContain('"default"');
    expect(result.stdout).toContain('"handle"');
  });
});

// Feature 1 inspiration code lives in lib/prompts/generate.ts +
// lib/inspiration/uzbek.ts. The api/generate.ts bundle test above already
// covers them transitively, but explicit per-module bundles catch
// regressions where one of the two files becomes un-bundle-able in
// isolation (e.g. a stray top-level await, a missing .js extension on a
// new import added in a future commit).
describe('production runtime parity — Feature 1 inspiration modules', () => {
  const bundles: BundleResult[] = [];

  afterAll(() => {
    for (const b of bundles) rmSync(b.workDir, { recursive: true, force: true });
  });

  it('lib/prompts/generate.ts bundles + loads as ESM with buildGeneratePrompt named export', () => {
    const b = bundleEntry(join('lib', 'prompts', 'generate.ts'));
    bundles.push(b);
    const result = importBundle(
      b.outFile,
      `if (typeof m.buildGeneratePrompt !== 'function') {
         throw new Error('expected buildGeneratePrompt named export');
       }`,
    );
    if (result.status !== 0) {
      throw new Error(
        `Vercel-style load failed for lib/prompts/generate.ts (exit ${result.status}).\n` +
          `STDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
      );
    }
    expect(result.stdout).toContain('SMOKE_OK');
  });

  it('lib/inspiration/uzbek.ts bundles + loads with non-empty UZBEK_ROOTS and pickRoots helper', () => {
    const b = bundleEntry(join('lib', 'inspiration', 'uzbek.ts'));
    bundles.push(b);
    const result = importBundle(
      b.outFile,
      `if (!Array.isArray(m.UZBEK_ROOTS)) throw new Error('UZBEK_ROOTS not array');
       if (m.UZBEK_ROOTS.length < 100) {
         throw new Error('UZBEK_ROOTS unexpectedly small: ' + m.UZBEK_ROOTS.length);
       }
       if (typeof m.pickRoots !== 'function') throw new Error('pickRoots missing');
       if (typeof m.getRootsByCategory !== 'function') throw new Error('getRootsByCategory missing');`,
    );
    if (result.status !== 0) {
      throw new Error(
        `Vercel-style load failed for lib/inspiration/uzbek.ts (exit ${result.status}).\n` +
          `STDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
      );
    }
    expect(result.stdout).toContain('SMOKE_OK');
  });
});

// Dynamic [name].js routes broke once on Vercel preview when they were renamed
// to [name].cjs in commit c2c83d1 — Vercel's auto-router doesn't pick up .cjs
// dynamic routes. This guard imports each handler the same way Vercel will at
// request time, so a regression of that kind fails CI before it reaches a
// preview deploy.
describe('production runtime parity — /api/check-* dynamic routes', () => {
  const ROUTES = ['check-uz', 'check-tg', 'check-ig'] as const;
  const bundles: BundleResult[] = [];

  afterAll(() => {
    for (const b of bundles) rmSync(b.workDir, { recursive: true, force: true });
  });

  it.each(ROUTES)('api/%s/[name].js bundles + loads as ESM with default export', (route) => {
    const b = bundleEntry(join('api', route, '[name].js'));
    bundles.push(b);
    const result = importBundle(
      b.outFile,
      `
        if (typeof m.default !== 'function') {
          throw new Error('expected default export to be the dynamic-route handler');
        }
      `,
    );
    if (result.status !== 0) {
      throw new Error(
        `Vercel-style load failed for /api/${route}/[name].js (exit ${result.status}).\n` +
          `STDOUT: ${result.stdout}\nSTDERR: ${result.stderr}`,
      );
    }
    expect(result.stdout).toContain('SMOKE_OK');
    expect(result.stdout).toContain('"default"');
  });
});
