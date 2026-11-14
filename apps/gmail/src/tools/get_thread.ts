import { defineTool } from '@standardagents/spec';
import { z } from 'zod';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const BODY_LIMIT = 2000;

interface Part {
  mimeType?: string;
  body?: { data?: string };
  parts?: Part[];
  headers?: { name?: string; value?: string }[];
}

interface ThreadMessage {
  id: string;
  labelIds?: string[];
  snippet?: string;
  payload?: Part;
}

/**
 * A thread is one unit of meaning in email. Reading it as a thread rather than
 * as N separate messages is the difference between an agent that understands a
 * conversation and one that repeats itself.
 */
export default defineTool({
  description:
    'Read a whole email thread by thread id: every message in order, with sender, date and text. Use when the brief is about a conversation rather than a single mail.',
  args: z.object({
    threadId: z.string().min(1).describe('Thread id from search_messages'),
  }),
  variables: [
    {
      name: 'GOOGLE_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token with the gmail.readonly scope',
    },
  ],
  execute: async (state, { threadId }) => {
    const token = await state.env('GOOGLE_ACCESS_TOKEN');
    const response = await fetch(`${GMAIL}/threads/${encodeURIComponent(threadId)}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return { status: 'error', error: `Gmail returned HTTP ${response.status} for thread ${threadId}` };
    }

    const thread = (await response.json()) as { id: string; messages?: ThreadMessage[] };
    const messages = (thread.messages ?? []).map((message) => {
      const headers = Object.fromEntries(
        (message.payload?.headers ?? []).map((header) => [
          (header.name ?? '').toLowerCase(),
          header.value ?? '',
        ]),
      );
      const body = extractText(message.payload) ?? message.snippet ?? '';
      return {
        id: message.id,
        from: headers.from ?? null,
        date: headers.date ?? null,
        subject: headers.subject ?? null,
        labels: message.labelIds ?? [],
        body: body.slice(0, BODY_LIMIT),
        truncated: body.length > BODY_LIMIT,
      };
    });

    return {
      status: 'success',
      result: JSON.stringify({ threadId: thread.id, messages, count: messages.length }, null, 2),
    };
  },
});

function extractText(part: Part | undefined): string | undefined {
  if (!part) return undefined;
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return Buffer.from(part.body.data, 'base64url').toString('utf8');
  }
  for (const child of part.parts ?? []) {
    const text = extractText(child);
    if (text) return text;
  }
  return undefined;
}
