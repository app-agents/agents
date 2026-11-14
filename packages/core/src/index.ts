/**
 * Shared types and helpers for app-agents.
 *
 * The manifest shape lives in ./manifest.ts as a zod schema, so the same
 * definition validates the file at build time and types it at compile time.
 */
import type { AppManifest, Registry } from './manifest.js';

export {
  appManifestSchema,
  capabilityLevelSchema,
  connectorSchema,
  credentialSchema,
  expertSchema,
  expertStatusSchema,
  parseManifest,
  parseRegistry,
  registrySchema,
} from './manifest.js';

export type {
  AppManifest,
  CapabilityLevel,
  ConnectorManifest,
  CredentialRequirement,
  ExpertManifest,
  ExpertStatus,
  Registry,
} from './manifest.js';

/** True when `query` names this app by slug, title, or alias. */
export function matchesApp(app: AppManifest, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  if (normalize(app.app) === q) return true;
  if (normalize(app.title) === q) return true;
  return app.aliases.some((alias) => normalize(alias) === q);
}

/** Every app whose slug, title, alias, or expert text contains the query. */
export function searchApps(registry: Registry, query: string): AppManifest[] {
  const q = normalize(query);
  if (!q) return registry.apps;
  return registry.apps.filter((app) => {
    const haystack = [app.app, app.title, ...app.aliases, ...app.experts.map((e) => `${e.id} ${e.title} ${e.job}`)]
      .map(normalize)
      .join(' ');
    return haystack.includes(q);
  });
}

/** Resolve an app by exact handle (slug, title, or alias). */
export function findApp(registry: Registry, query: string): AppManifest | undefined {
  return registry.apps.find((app) => matchesApp(app, query));
}

/** Flatten an app's capabilities into `expert:action = level` lines. */
export function describeCapabilities(app: AppManifest): string[] {
  return app.experts.flatMap((expert) =>
    Object.entries(expert.capabilities).map(
      ([action, level]) =>
        `${expert.id}:${action} = ${level}${expert.status === 'gap' ? ' (planned)' : ''}`,
    ),
  );
}

/**
 * True when nothing the app *ships* can change state.
 *
 * Experts with status `gap` are declarations of intent, not code, so they are
 * excluded — otherwise an unimplemented write path would make a read-only app
 * report itself as write-capable.
 */
export function isReadOnly(app: AppManifest): boolean {
  const shipped = app.experts.filter((expert) => expert.status !== 'gap');
  if (shipped.length === 0) return true;
  return shipped.every((expert) =>
    Object.values(expert.capabilities).every((level) => level === 'read'),
  );
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
