#!/usr/bin/env node
/**
 * Verifies every name a package references actually exists.
 *
 * Type generation catches typos in prompt `tools` and `model` fields. This
 * catches the rest: agent sides, stop tools, subagent relationships, entry
 * agents, and — the part types can never see — the manifest's capability
 * claims against the tools the package really exports.
 *
 * Fast, dependency-free, and it runs in CI before anything is published.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseManifest } from '@app-agents/core';

const root = path.resolve(import.meta.dirname, '..');
const appsDir = path.join(root, 'apps');

type Loader<T> = () => Promise<T>;

interface PromptLike {
  name: string;
  model: string;
  tools?: (string | { name: string })[];
}

interface AgentLike {
  name: string;
  sideA: {
    prompt?: string;
    stopTool?: string;
    subagents?: { agent: string }[];
  };
}

interface Packed {
  agents?: Record<string, Loader<AgentLike>>;
  prompts?: Record<string, Loader<PromptLike>>;
  tools?: Record<string, Loader<unknown>>;
  models?: Record<string, Loader<unknown>>;
  __meta?: { packageId: string; entryAgents: string[] };
}

interface Report {
  app: string;
  errors: string[];
  checked: number;
}

const reports: Report[] = [];

for (const entry of await readdirEntries()) {
  const app = entry;
  const errors: string[] = [];
  let checked = 0;

  const pkg = (await import(path.join(appsDir, app, 'src/index.ts'))) as Packed;
  const agentNames = new Set(Object.keys(pkg.agents ?? {}));
  const promptNames = new Set(Object.keys(pkg.prompts ?? {}));
  const toolNames = new Set(Object.keys(pkg.tools ?? {}));
  const modelNames = new Set(Object.keys(pkg.models ?? {}));

  // 1. Every prompt resolves its model and its tools.
  for (const [name, load] of Object.entries(pkg.prompts ?? {})) {
    const prompt = await load();
    checked += 1;
    if (!modelNames.has(prompt.model)) {
      errors.push(`prompt ${name}: model "${prompt.model}" is not exported`);
    }
    for (const tool of prompt.tools ?? []) {
      const ref = typeof tool === 'string' ? tool : tool.name;
      if (!toolNames.has(ref) && !promptNames.has(ref) && !agentNames.has(ref)) {
        errors.push(`prompt ${name}: names "${ref}", which is not exported`);
      }
    }
  }

  // 2. Every agent side resolves its prompt, stop tool and subagents.
  for (const [name, load] of Object.entries(pkg.agents ?? {})) {
    const agent = await load();
    checked += 1;
    if (agent.sideA.prompt && !promptNames.has(agent.sideA.prompt)) {
      errors.push(`agent ${name}: prompt "${agent.sideA.prompt}" is not exported`);
    }
    if (agent.sideA.stopTool && !toolNames.has(agent.sideA.stopTool)) {
      errors.push(`agent ${name}: stopTool "${agent.sideA.stopTool}" is not exported`);
    }
    for (const subagent of agent.sideA.subagents ?? []) {
      if (!agentNames.has(subagent.agent)) {
        errors.push(`agent ${name}: subagent "${subagent.agent}" is not exported`);
      }
    }
  }

  // 3. Every entry agent exists.
  for (const name of pkg.__meta?.entryAgents ?? []) {
    if (!agentNames.has(name)) errors.push(`__meta: entry agent "${name}" is not exported`);
  }

  // 4. The manifest describes this package, and its capability claims are real.
  const manifest = parseManifest(
    await readFile(path.join(appsDir, app, 'manifest.json'), 'utf8'),
    `${app}/manifest.json`,
  );
  checked += 1;

  if (manifest.package !== pkg.__meta?.packageId) {
    errors.push(
      `manifest: package "${manifest.package}" does not match __meta.packageId "${pkg.__meta?.packageId}"`,
    );
  }

  for (const expert of manifest.experts) {
    if (expert.status === 'gap') {
      if (expert.agent) errors.push(`manifest: gap expert "${expert.id}" must not name an agent`);
      continue;
    }
    if (!expert.agent) {
      errors.push(`manifest: expert "${expert.id}" is ${expert.status} but names no agent`);
    } else if (!agentNames.has(expert.agent)) {
      errors.push(`manifest: expert "${expert.id}" agent "${expert.agent}" is not exported`);
    }
    for (const action of Object.keys(expert.capabilities)) {
      if (!toolNames.has(action)) {
        errors.push(
          `manifest: expert "${expert.id}" claims capability "${action}", which is not an exported tool`,
        );
      }
    }
  }

  reports.push({ app, errors, checked });
}

const failed = reports.filter((report) => report.errors.length > 0);

for (const report of reports) {
  const mark = report.errors.length === 0 ? 'ok  ' : 'FAIL';
  console.log(`${mark} ${report.app} (${report.checked} definitions)`);
  for (const error of report.errors) console.log(`       ${error}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} app(s) have broken references.`);
  process.exit(1);
}

console.log(`\nall ${reports.length} app(s) resolve every reference`);

async function readdirEntries(): Promise<string[]> {
  const entries = await import('node:fs/promises').then((fs) =>
    fs.readdir(appsDir, { withFileTypes: true }),
  );
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
