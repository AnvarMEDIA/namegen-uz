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
