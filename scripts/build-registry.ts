#!/usr/bin/env node
/**
 * Builds registry.json from every apps/<slug>/manifest.json.
 *
 * Each manifest is validated against the zod schema in @app-agents/core, so a
 * typo, a missing field or a capability that names nothing fails the build with
 * a path instead of landing in the published registry.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseManifest, registrySchema } from '@app-agents/core';

const root = path.resolve(import.meta.dirname, '..');
const appsDir = path.join(root, 'apps');

const apps = [];
const problems = [];

for (const entry of await readdir(appsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const manifestPath = path.join(appsDir, entry.name, 'manifest.json');
  if (!existsSync(manifestPath)) {
    problems.push(`${entry.name}: missing manifest.json`);
    continue;
  }

  try {
    const manifest = parseManifest(await readFile(manifestPath, 'utf8'), `${entry.name}/manifest.json`);
    if (manifest.app !== entry.name) {
      problems.push(`${entry.name}: "app" is "${manifest.app}" but the folder is "${entry.name}"`);
      continue;
    }
    apps.push(manifest);
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }
}

if (problems.length > 0) {
  console.error('registry build failed:\n' + problems.map((problem) => `  - ${problem}`).join('\n'));
  process.exit(1);
}

apps.sort((a, b) => a.app.localeCompare(b.app));

const registry = registrySchema.parse({
  schema: 1,
  generatedAt: new Date().toISOString(),
  apps,
});

await writeFile(path.join(root, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`registry.json: ${apps.length} app(s) — ${apps.map((app) => app.app).join(', ')}`);
