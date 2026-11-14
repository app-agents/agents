import { defineTool } from '@standardagents/spec';
import { z } from 'zod';

/**
 * The terminal tool. The agent does not end a turn with prose: it ends by
 * calling this, so every answer arrives as a validated object with evidence
 * attached. A claim without a message id is a claim the caller cannot check.
 */
export default defineTool({
  description:
    'Submit the finished answer. This ends your turn. Every factual claim must list the message ids it came from.',
  args: z.object({
    answer: z
      .string()
      .min(1)
      .describe('The answer to the brief, plain text, no markdown headings. Say what you found and what it means.'),
    evidence: z
      .array(
        z.object({
          messageId: z.string().describe('Gmail message id this claim came from'),
          subject: z.string().nullable().describe('Subject as written, or null'),
          from: z.string().nullable().describe('Sender as written, or null'),
          date: z.string().nullable().describe('Date as written in the header, or null'),
          supports: z.string().describe('The specific claim in the answer this message supports'),
        }),
      )
      .describe('Every message the answer relies on. Empty only when nothing matched.'),
    confidence: z
      .enum(['high', 'medium', 'low'])
      .describe('high: read the relevant mail. medium: partial or inferred. low: guessed from search results alone.'),
    unresolved: z
      .string()
      .nullable()
      .describe('What you could not determine and why, or null. Never leave this null by default.'),
  }),
  execute: async (_state, { answer, evidence, confidence, unresolved }) => ({
    status: 'success',
    result: JSON.stringify({ answer, evidence, confidence, unresolved }, null, 2),
  }),
});
