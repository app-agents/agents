import { defineAgent } from '@standardagents/spec';

/**
 * Entry agent. Human on side B, the triage prompt on side A.
 *
 * The entry agent is what a runtime installs, a platform approves, and another
 * agent calls. Jobs live inside it as prompts or subagents — see
 * apps/snapchat-ads for the dispatcher shape once there is more than one job.
 */
export default defineAgent({
  name: 'gmail_agent',
  sideA: {
    prompt: 'gmail_triage',
    stopOnResponse: true,
    maxSteps: 14,
  },
  sideB: { human: true },
});
