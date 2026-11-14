import { defineAgent } from '@standardagents/spec';

/**
 * The domain agent: one mailbox, any question.
 *
 * It ends on `submit_result`, not on a text reply, so every answer arrives as
 * a validated object with evidence. Callers can trust the envelope without
 * parsing prose, and an answer with no evidence is visibly empty rather than
 * quietly confident.
 */
export default defineAgent({
  name: 'gmail_agent',
  sideA: {
    prompt: 'gmail',
    stopTool: 'submit_result',
    stopToolResponseProperty: 'result',
    maxSteps: 16,
  },
  sideB: { human: true },
});
