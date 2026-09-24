const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const path = require('node:path');

require('dotenv').config();

/**
 * Run each integration test file through its own `node --test` process.
 *
 * The multi-file runner intermittently corrupts its IPC channel on Windows with
 * our DB/socket-heavy files ("Unable to deserialize cloned data"). One runner
 * per file is deterministic and keeps output identical.
 */
const integrationDir = path.join(__dirname, '..', 'tests', 'integration');
const files = readdirSync(integrationDir)
  .filter((file) => file.endsWith('.test.ts'))
  .sort();

const argsFor = (file) => [
  '--test',
  '--test-concurrency=1',
  '--require',
  'ts-node/register/transpile-only',
  '--require',
  './tests/testEnv.ts',
  path.join('tests', 'integration', file),
];

function runFile(file) {
  return spawnSync(process.execPath, argsFor(file), {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'inherit',
  });
}

let failedFiles = 0;

for (const file of files) {
  let result = runFile(file);

  // Node's test runner intermittently drops the child IPC channel on Windows
  // ("Unable to deserialize cloned data"); the file passes on a clean rerun.
  if (result.status !== 0) {
    console.warn(`↻ retrying ${file} after a runner-level failure`);
    result = runFile(file);
  }

  if (result.status !== 0) {
    failedFiles += 1;
    console.error(`✖ ${file} failed`);
  }
}

console.log(`Integration files: ${files.length - failedFiles}/${files.length} passed`);
process.exit(failedFiles === 0 ? 0 : 1);
