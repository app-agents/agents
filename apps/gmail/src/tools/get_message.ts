import { defineTool } from '@standardagents/spec';
import { z } from 'zod';

const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me';
const BODY_LIMIT = 6000;

interface GmailPart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
  headers?: { name?: string; value?: string }[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPart;
}

export default defineTool({
  description:
    'Read one Gmail message by id: headers, labels, and the plain-text body. Bodies are truncated.',
  args: z.object({
    id: z.string().min(1).describe('Message id from list_messages'),
  }),
  variables: [
    {
      name: 'GOOGLE_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token with the gmail.readonly scope',
    },
  ],
  execute: async (state, { id }) => {
    const token = await state.env('GOOGLE_ACCESS_TOKEN');
    const response = await fetch(`${GMAIL}/messages/${encodeURIComponent(id)}?format=full`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      return { status: 'error', error: `Gmail returned HTTP ${response.status} for message ${id}` };
    }

    const message = (await response.json()) as GmailMessage;
    const headers = Object.fromEntries(
      (message.payload?.headers ?? [])
        .filter((header) => header.name && header.value)
        .map((header) => [header.name!.toLowerCase(), header.value!]),
    );
    const body = extractText(message.payload) ?? message.snippet ?? '';

    return {
      status: 'success',
      result: JSON.stringify(
        {
          id: message.id,
          threadId: message.threadId,
          from: headers.from ?? null,
          to: headers.to ?? null,
          subject: headers.subject ?? null,
          date: headers.date ?? null,
          labels: message.labelIds ?? [],
          body: body.slice(0, BODY_LIMIT),
          truncated: body.length > BODY_LIMIT,
        },
        null,
        2,
      ),
    };
  },
});

function extractText(part: GmailPart | undefined): string | undefined {
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
