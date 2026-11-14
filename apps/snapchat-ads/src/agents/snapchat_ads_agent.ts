import { defineAgent } from '@standardagents/spec';

/**
 * Entry agent for the app: the thing that gets installed, approved in a
 * platform console, and called by another agent. It owns no tools — it routes
 * to the experts in this package.
 */
export default defineAgent({
  name: 'snapchat_ads_agent',
  sideA: {
    prompt: 'snapchat_ads_router',
    stopOnResponse: true,
    maxSteps: 6,
    subagents: [{ agent: 'campaign_report_agent', as: 'campaign_report', blocking: true }],
  },
  sideB: { human: true },
});
