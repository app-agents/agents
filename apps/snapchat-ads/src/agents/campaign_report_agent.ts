import { defineAgent } from '@standardagents/spec';

/** One job: read campaigns, pull stats, recommend. Read-only. */
export default defineAgent({
  name: 'campaign_report_agent',
  exposeAsTool: true,
  toolDescription:
    'Report on Snapchat Ads performance and recommend what to change first. Read-only.',
  sideA: {
    prompt: 'campaign_report',
    stopOnResponse: true,
    maxSteps: 12,
  },
  sideB: { human: true },
});
