/**
 * Manifest schemas.
 *
 * One source of truth for the shape of `apps/<app>/manifest.json`. Everything
 * else — the registry build, the CLI, the tests — derives from these, so a
 * malformed manifest fails the build instead of turning into `undefined` three
 * layers away.
 */
import { z } from 'zod';

export const capabilityLevelSchema = z.enum(['read', 'write', 'confirm']);

export const expertStatusSchema = z.enum(['stable', 'beta', 'gap']);

export const expertSchema = z.object({
  /**
   * Job name inside the app, e.g. `campaign_report`.
   *
   * Capability keys are tool names. That is deliberate: the manifest claims
   * reach, and `scripts/check-wiring.ts` verifies every claim against the
   * package's exported tools.
   */
  id: z.string().min(1),
  title: z.string().min(1),
  job: z.string().min(1),
  status: expertStatusSchema,
  agent: z.string().min(1).optional(),
  capabilities: z.record(z.string().min(1), capabilityLevelSchema),
});

export const credentialSchema = z.object({
  env: z.string().min(1),
  scopes: z.array(z.string().min(1)).optional(),
  how: z.string().min(1),
});

export const connectorSchema = z.object({
  kind: z.enum(['mcp', 'rest', 'cli']),
  baseUrl: z.string().url().optional(),
  auth: z.enum(['oauth', 'apikey', 'none']),
  writes: z.boolean(),
});

export const appManifestSchema = z.object({
  app: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'app slug must be lowercase words joined by dashes'),
  title: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  package: z
    .string()
    .regex(/^@[a-z0-9-]+\/[a-z0-9-]+$/, 'package must be a scoped npm name, @scope/name'),
  connector: connectorSchema,
  credentials: z.array(credentialSchema),
  experts: z.array(expertSchema).min(1),
  gate: z.string().min(1).optional(),
  dataRetention: z.string().min(1).optional(),
});

export const registrySchema = z.object({
  schema: z.literal(1),
  generatedAt: z.string().min(1),
  apps: z.array(appManifestSchema),
});

export type CapabilityLevel = z.infer<typeof capabilityLevelSchema>;
export type ExpertStatus = z.infer<typeof expertStatusSchema>;
export type ExpertManifest = z.infer<typeof expertSchema>;
export type CredentialRequirement = z.infer<typeof credentialSchema>;
export type ConnectorManifest = z.infer<typeof connectorSchema>;
export type AppManifest = z.infer<typeof appManifestSchema>;
export type Registry = z.infer<typeof registrySchema>;

/** Parse a registry document, or throw with the path of the first problem. */
export function parseRegistry(text: string, source = 'registry.json'): Registry {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }

  const result = registrySchema.safeParse(json);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`${source} does not match the registry schema:\n${problems}`);
  }
  return result.data;
}

/** Parse one app manifest, or throw with the path of the first problem. */
export function parseManifest(text: string, source = 'manifest.json'): AppManifest {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${source} is not valid JSON: ${error instanceof Error ? error.message : error}`);
  }

  const result = appManifestSchema.safeParse(json);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`${source} does not match the manifest schema:\n${problems}`);
  }
  return result.data;
}
