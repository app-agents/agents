import { defineTool } from '@standardagents/spec';
import { z } from 'zod';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const HEADERS = ['Subject', 'From', 'To', 'Date'];

interface Ref {
  id: string;
  threadId: string;
}

interface Message {
  id: string;
  threadId: string;
  snippet?: string;
  labelIds?: string[];
  payload?: { headers?: { name?: string; value?: string }[] };
}

/**
 * One step returns a readable row per message, not just ids. An agent that has
 * to call get_message five times to learn five subjects burns its step budget
 * on discovery instead of thinking.
 */
export default defineTool({
  description:
    'Search the mailbox and return one row per message: id, thread id, sender, recipients, subject, date, snippet, labels. Use this before reading anything.',
  args: z.object({
    query: z
      .string()
      .min(1)
      .describe('Gmail search syntax, e.g. "from:greenhouse.io newer_than:30d" or "subject:application -in:spam"'),
    maxResults: z.number().int().min(1).max(25).default(15).describe('How many messages to return'),
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
    const auth = { Authorization: `Bearer ${token}` };

    const listUrl = `${GMAIL}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    const listResponse = await fetch(listUrl, { headers: auth });
    if (!listResponse.ok) {
      return { status: 'error', error: `Gmail search returned HTTP ${listResponse.status}` };
    }

    const listed = (await listResponse.json()) as { messages?: Ref[]; resultSizeEstimate?: number };
    const refs = listed.messages ?? [];

    const headerQuery = HEADERS.map((header) => `metadataHeaders=${header}`).join('&');
    const rows = await Promise.all(
      refs.map(async (ref) => {
        const url = `${GMAIL}/messages/${ref.id}?format=metadata&${headerQuery}`;
        const response = await fetch(url, { headers: auth });
        if (!response.ok) {
          return { id: ref.id, threadId: ref.threadId, error: `HTTP ${response.status}` };
        }
        const message = (await response.json()) as Message;
        const headers = Object.fromEntries(
          (message.payload?.headers ?? []).map((header) => [
            (header.name ?? '').toLowerCase(),
            header.value ?? '',
          ]),
        );
        return {
          id: message.id,
          threadId: message.threadId,
          from: headers.from ?? null,
          to: headers.to ?? null,
          subject: headers.subject ?? null,
          date: headers.date ?? null,
          snippet: message.snippet ?? null,
          labels: message.labelIds ?? [],
        };
      }),
    );

    return {
      status: 'success',
      result: JSON.stringify(
        {
          query,
          returned: rows.length,
          resultSizeEstimate: listed.resultSizeEstimate ?? null,
          messages: rows,
        },
        null,
        2,
      ),
    };
  },
});
