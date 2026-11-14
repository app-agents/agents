/**
 * Shared types for app-agents.
 *
 * One app manifest describes one app, the expert agents inside it, and
 * exactly what those agents are allowed to do. The manifest is the source of
 * truth for the registry, the CLI, and the "what can you promise a customer"
 * answer.
 */

export type CapabilityLevel = 'read' | 'write' | 'confirm';

export type ExpertStatus = 'stable' | 'beta' | 'gap';

export interface ExpertManifest {
  /** Job name inside the app, e.g. `campaign_report`. */
  id: string;
  /** Human label, e.g. "Campaign report". */
  title: string;
  /** One sentence: the decision this agent makes that a tool call cannot. */
  job: string;
  status: ExpertStatus;
  /** Entry agent name exported by the package. Absent while status is `gap`. */
  agent?: string;
  /** action -> permission level. Nothing not listed here is reachable. */
  capabilities: Record<string, CapabilityLevel>;
}

export interface CredentialRequirement {
  /** Environment variable the tool reads through state.env(). */
  env: string;
  scopes?: string[];
  /** What the operator has to do to produce this credential. */
  how: string;
}

export interface ConnectorManifest {
  kind: 'mcp' | 'rest' | 'cli';
  baseUrl?: string;
  auth: 'oauth' | 'apikey' | 'none';
  /** False means every tool in this app is read-only. */
  writes: boolean;
}

export interface AppManifest {
  /** URL-safe app slug. This is the registry key and the lookup handle. */
  app: string;
  title: string;
  /** What people actually type: "snap", "insta", "gmail", "workspace mail". */
  aliases: string[];
  /** npm package name. */
  package: string;
  connector: ConnectorManifest;
  credentials: CredentialRequirement[];
  experts: ExpertManifest[];
  /** Extra operator notes, e.g. platform review requirements. */
  gate?: string;
  /** Vendor terms that constrain what you may do with returned data. */
  dataRetention?: string;
}

export interface Registry {
  schema: 1;
  generatedAt: string;
  apps: AppManifest[];
}

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
