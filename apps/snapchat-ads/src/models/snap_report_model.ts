import { defineModel } from '@standardagents/spec';
import { anthropic } from '@standardagents/anthropic';

export default defineModel({
  name: 'snap_report_model',
  provider: anthropic,
  model: 'claude-sonnet-4-6',
});
