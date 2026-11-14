import { defineModel } from '@standardagents/spec';
import { anthropic } from '@standardagents/anthropic';

/**
 * Extraction is read once and trusted afterwards — the rows end up in a
 * statutory report — so it uses the stronger model. If cost per mailbox starts
 * to matter, swap this to a cheaper tier and re-run the fixtures; the prompt is
 * the only thing that needs to hold.
 */
export default defineModel({
  name: 'gmail_extract_model',
  provider: anthropic,
  model: 'claude-sonnet-4-6',
});
