/**
 * Package entry point.
 *
 * Exports the shape the spec's packaging section expects: named registries of
 * lazy definition loaders. Loaders are inferred rather than annotated so each
 * tool keeps its own argument schema in the type.
 */
export const agents = {
  gmail_agent: async () => (await import('./agents/gmail_agent.js')).default,
  application_extract_agent: async () => (await import('./agents/application_extract_agent.js')).default,
} as const;

export const prompts = {
  gmail_triage: async () => (await import('./prompts/gmail_triage.js')).default,
  application_extract: async () => (await import('./prompts/application_extract.js')).default,
} as const;

export const tools = {
  list_messages: async () => (await import('./tools/list_messages.js')).default,
  get_message: async () => (await import('./tools/get_message.js')).default,
} as const;

export const models = {
  gmail_triage_model: async () => (await import('./models/gmail_triage_model.js')).default,
  gmail_extract_model: async () => (await import('./models/gmail_extract_model.js')).default,
} as const;

export const __meta = {
  packageId: '@app-agents/gmail',
  version: '0.2.0',
  entryAgents: ['gmail_agent', 'application_extract_agent'],
  packedAt: 0,
  description: 'Gmail agent — triage an inbox, and extract the job applications sent in a period',
} as const;
