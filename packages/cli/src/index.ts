#!/usr/bin/env node
/**
 * app-agents CLI
 *
 *   app-agents list
 *   app-agents search snap
 *   app-agents show gmail
 *   app-agents auth gmail
 *   app-agents add gmail
 *
 * The registry is read from, in order:
 *   1. $APP_AGENTS_REGISTRY (a file path or an https URL)
 *   2. the nearest registry.json, walking up from the working directory
 *   3. the published registry
 */
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  describeCapabilities,
  findApp,
  isReadOnly,
  searchApps,
  type AppManifest,
  type Registry,
} from '@app-agents/core';

const PUBLISHED_REGISTRY =
  'https://cdn.jsdelivr.net/gh/app-agents/agents@main/registry.json';

async function loadRegistry(): Promise<Registry> {
  const override = process.env.APP_AGENTS_REGISTRY;
  if (override) {
    return parseRegistry(await readSource(override), override);
  }

  const local = findUpward('registry.json', process.cwd());
  if (local) {
    return parseRegistry(await readFile(local, 'utf8'), local);
  }

  return parseRegistry(await readSource(PUBLISHED_REGISTRY), PUBLISHED_REGISTRY);
}

async function readSource(source: string): Promise<string> {
  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Could not fetch ${source} (HTTP ${response.status})`);
    return response.text();
  }
  return readFile(path.resolve(source), 'utf8');
}

function parseRegistry(text: string, source: string): Registry {
  try {
    return JSON.parse(text) as Registry;
  } catch {
    throw new Error(`${source} is not valid JSON`);
  }
}

function findUpward(file: string, from: string): string | undefined {
  let dir = from;
  while (true) {
    const candidate = path.join(dir, file);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function requireApp(registry: Registry, handle: string | undefined): AppManifest {
  if (!handle) {
    fail('Name an app. Try: app-agents search gmail');
  }
  const app = findApp(registry, handle);
  if (app) return app;

  const close = searchApps(registry, handle);
  if (close.length) {
    fail(`No app named "${handle}". Did you mean: ${close.map((a) => a.app).join(', ')}?`);
  }
  fail(`No app named "${handle}". Run: app-agents list`);
}

const commands = {
  async list(registry: Registry, args: string[]) {
    if (args.includes('--json')) {
      process.stdout.write(`${JSON.stringify(registry, null, 2)}\n`);
      return;
    }
    const rows = registry.apps.flatMap((app) =>
      app.experts.map((expert) => [
        app.app,
        expert.id,
        expert.status,
        isReadOnly(app) ? 'read-only' : 'writes',
        expert.job,
      ]),
    );
    printTable(['APP', 'EXPERT', 'STATUS', 'MODE', 'JOB'], rows);
  },

  async search(registry: Registry, args: string[]) {
    const query = args.join(' ');
    if (!query) fail('Search for something. Try: app-agents search snapchat');
    const results = searchApps(registry, query);
    if (!results.length) {
      process.stdout.write(`Nothing for "${query}".\n`);
      return;
    }
    printTable(
      ['APP', 'PACKAGE', 'EXPERTS'],
      results.map((app) => [
        app.app,
        app.package,
        app.experts.map((e) => `${e.id} (${e.status})`).join(', '),
      ]),
    );
  },

  async show(registry: Registry, args: string[]) {
    const app = requireApp(registry, args[0]);
    const lines = [
      `${app.title}  [${app.app}]`,
      '',
      `package:   ${app.package}`,
      `connector: ${app.connector.kind} · ${app.connector.auth} · ${app.connector.writes ? 'writes' : 'read-only'}`,
      `aliases:   ${app.aliases.join(', ') || '—'}`,
      '',
      'experts:',
      ...app.experts.map((e) => `  ${e.id} [${e.status}] — ${e.job}`),
      '',
      'capabilities:',
      ...describeCapabilities(app).map((line) => `  ${line}`),
    ];
    if (app.credentials.length) {
      lines.push('', 'credentials:');
      for (const credential of app.credentials) {
        lines.push(`  ${credential.env}${credential.scopes?.length ? ` (${credential.scopes.join(' ')})` : ''}`);
        lines.push(`    ${credential.how}`);
      }
    }
    if (app.gate) lines.push('', `gate: ${app.gate}`);
    if (app.dataRetention) lines.push(`data: ${app.dataRetention}`);
    process.stdout.write(`${lines.join('\n')}\n`);
  },

  async auth(registry: Registry, args: string[]) {
    const app = requireApp(registry, args[0]);
    if (!app.credentials.length) {
      process.stdout.write(`${app.title} needs no credentials.\n`);
      return;
    }
    process.stdout.write(`Credentials for ${app.title}:\n\n`);
    for (const credential of app.credentials) {
      process.stdout.write(`  ${credential.env}\n`);
      if (credential.scopes?.length) process.stdout.write(`    scopes: ${credential.scopes.join(', ')}\n`);
      process.stdout.write(`    ${credential.how}\n\n`);
    }
    if (app.gate) process.stdout.write(`Platform gate: ${app.gate}\n`);
  },

  async add(registry: Registry, args: string[]) {
    const app = requireApp(registry, args[0]);
    const dry = args.includes('--dry');
    const command = `npm install ${app.package}`;
    if (dry) {
      process.stdout.write(`${command}\n`);
      return;
    }
    process.stdout.write(`${command}\n`);
    await new Promise<void>((resolve, reject) => {
      const child = spawn('npm', ['install', app.package], { stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error(`npm install exited with ${code}`)),
      );
    });
    process.stdout.write(`\nInstalled ${app.package}.\n`);
    if (app.credentials.length) {
      process.stdout.write(`Next: app-agents auth ${app.app}\n`);
    }
  },

  async help() {
    process.stdout.write(
      [
        'app-agents — find, install and inspect agents for apps',
        '',
        '  app-agents list [--json]     every app, expert and permission level',
        '  app-agents search <query>    search by app name, alias, or job',
        '  app-agents show <app>        capabilities, credentials, gates',
        '  app-agents auth <app>        what the operator must provide',
        '  app-agents add <app> [--dry] install the package',
        '',
        'Registry: $APP_AGENTS_REGISTRY, ./registry.json, or the published copy.',
      ].join('\n') + '\n',
    );
  },
};

function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => (row[index] ?? '').length)),
  );
  const render = (row: string[]) =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join('  ').trimEnd();
  process.stdout.write(`${render(headers)}\n`);
  process.stdout.write(`${widths.map((width) => '─'.repeat(width)).join('  ')}\n`);
  for (const row of rows) process.stdout.write(`${render(row)}\n`);
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [command = 'help', ...args] = process.argv.slice(2);
  if (command === 'help' || command === '--help' || command === '-h') {
    await commands.help();
    return;
  }
  const handler = commands[command as keyof typeof commands];
  if (!handler || command === 'help') {
    await commands.help();
    process.exitCode = 1;
    return;
  }
  const registry = await loadRegistry();
  await (handler as (registry: Registry, args: string[]) => Promise<void>)(registry, args);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
