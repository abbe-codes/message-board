/// <reference types="node" />

const { existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const nextBin = path.resolve(__dirname, '..', '..', '..', 'node_modules', 'next', 'dist', 'bin', 'next');
const systemNode = 'C:\\Program Files\\nodejs\\node.exe';
const nodeBinary =
  process.env.NEXT_NODE_BINARY ||
  (process.platform === 'win32' && existsSync(systemNode) ? systemNode : process.execPath);

const result = spawnSync(nodeBinary, [nextBin, ...process.argv.slice(2)], {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
