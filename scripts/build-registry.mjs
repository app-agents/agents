#!/usr/bin/env node
/**
 * Builds registry.json from every apps/<slug>/manifest.json.
 *
 * The registry is generated, not hand-edited: the manifest inside each app is
 * the source of truth, and a missing or malformed manifest fails the build
 * rather than silently dropping an app.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const appsDir = path.join(root, 'apps');

const REQUIRED = ['app', 'title', 'aliases', 'package', 'connector', 'credentials', 'experts'];

const entries = [];
const problems = [];

for (const entry of await readdir(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = path.join(appsDir, entry.name, 'manifest.json');
  if (!existsSync(manifestPath)) {
    problems.push(`${entry.name}: missing manifest.json`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    problems.push(`${entry.name}: manifest.json is not valid JSON (${error.message})`);
    continue;
  }

  for (const key of REQUIRED) {
    if (!(key in manifest)) problems.push(`${entry.name}: missing "${key}"`);
  }
  if (manifest.app && manifest.app !== entry.name) {
    problems.push(`${entry.name}: "app" is "${manifest.app}" but the folder is "${entry.name}"`);
  }

  entries.push(manifest);
}

if (problems.length) {
  console.error('registry build failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}

entries.sort((a, b) => a.app.localeCompare(b.app));

const registry = {
  schema: 1,
  generatedAt: new Date().toISOString(),
  apps: entries,
};

await writeFile(path.join(root, 'registry.json'), JSON.stringify(registry, null, 2) + '\n');
console.log(`registry.json: ${entries.length} app(s) — ${entries.map((a) => a.app).join(', ')}`);
