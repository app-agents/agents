import { defineModel } from '@standardagents/spec';
import { anthropic } from '@standardagents/anthropic';

/**
 * Triage reads a handful of messages and writes a short report. It does not
 * need the strongest model, and the cheap tier keeps a daily job affordable.
 */
export default defineModel({
  name: 'gmail_triage_model',
  provider: anthropic,
  model: 'claude-sonnet-4-6',
});
