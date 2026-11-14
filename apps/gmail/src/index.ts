/**
 * Package entry point.
 *
 * `@app-agents/gmail` is Gmail competence, not job-search opinions. It ships
 * the mailbox tools and one domain agent that ends on a validated result.
 * Task prompts (application extraction, triage) live in examples/ and belong
 * to the apps that need them.
 */
export const agents = {
  gmail_agent: async () => (await import('./agents/gmail_agent.js')).default,
} as const;

export const prompts = {
  gmail: async () => (await import('./prompts/gmail.js')).default,
} as const;

export const tools = {
  search_messages: async () => (await import('./tools/search_messages.js')).default,
  get_message: async () => (await import('./tools/get_message.js')).default,
  get_thread: async () => (await import('./tools/get_thread.js')).default,
  submit_result: async () => (await import('./tools/submit_result.js')).default,
} as const;

export const models = {
  gmail_model: async () => (await import('./models/gmail_model.js')).default,
} as const;

export const __meta = {
  packageId: '@app-agents/gmail',
  version: '0.3.0',
  entryAgents: ['gmail_agent'],
  packedAt: 0,
  description: 'Gmail agent — search, read and explain one mailbox, with message-level evidence',
} as const;
