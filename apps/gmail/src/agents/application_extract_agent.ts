import { defineAgent } from '@standardagents/spec';

/** One job: turn a date range into application rows, with evidence. Read-only. */
export default defineAgent({
  name: 'application_extract_agent',
  exposeAsTool: true,
  toolDescription:
    'Extract the job applications submitted during a date range from Gmail as JSON, each with its source message id. Read-only.',
  sideA: {
    prompt: 'application_extract',
    stopOnResponse: true,
    maxSteps: 40,
  },
  sideB: { human: true },
});
