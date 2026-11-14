import { defineTool } from '@standardagents/spec';
import { z } from 'zod';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';

interface MessageRef {
  id: string;
  threadId: string;
}

/**
 * Returns message ids only. The agent then fetches the few it actually needs,
 * which keeps the token cost of a large inbox to a single call.
 */
export default defineTool({
  description:
    'List Gmail message ids matching a search query. Returns ids, thread ids and a count. Use get_message to read one.',
  args: z.object({
    query: z
      .string()
      .min(1)
      .default('in:inbox newer_than:2d')
      .describe('Gmail search syntax, e.g. "is:unread newer_than:1d -category:promotions"'),
    maxResults: z.number().int().min(1).max(50).default(20).describe('How many ids to return'),
  }),
  variables: [
    {
      name: 'GOOGLE_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token with the gmail.readonly scope',
    },
  ],
  execute: async (state, { query, maxResults }) => {
    const token = await state.env('GOOGLE_ACCESS_TOKEN');
    const url = `${GMAIL}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      return { status: 'error', error: `Gmail returned HTTP ${response.status}` };
    }

    const body = (await response.json()) as {
      messages?: MessageRef[];
      resultSizeEstimate?: number;
    };
    const messages = body.messages ?? [];

    return {
      status: 'success',
      result: JSON.stringify(
        {
          returned: messages.length,
          resultSizeEstimate: body.resultSizeEstimate ?? null,
          messages,
          note: messages.length === 0 ? 'No messages matched the query.' : undefined,
        },
        null,
        2,
      ),
    };
  },
});
