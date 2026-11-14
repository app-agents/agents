# Gmail — `@app-agents/gmail`

Two jobs, both read-only:

- **Inbox triage** — what needs the reader, why, with draft replies written out.
- **Application extract** — the jobs the person actually applied to in a date
  range, as structured rows with the email that proves each one.

Nothing is sent, archived, or labelled. Neither expert has a tool that can.

## Install

```bash
npm install @app-agents/gmail
```

## Credentials

`GOOGLE_ACCESS_TOKEN` — an OAuth access token with the
`https://www.googleapis.com/auth/gmail.readonly` scope.

Create an OAuth client in Google Cloud Console, enable the Gmail API, and mint
the token. Refresh happens in your host, not in this package: the spec's
credential grants cover bearer tokens, not refresh flows.

### The gate

`gmail.readonly` is a restricted scope. For users outside your Workspace:

- Google requires app verification plus a CASA security assessment.
- An OAuth client left in Testing expires refresh tokens after 7 days.

Both are real costs. Decide before promising a "connect your Gmail" button.

## Capabilities

| Expert | Action | Level |
|---|---|---|
| `inbox_triage` | `list_messages` | read |
| `inbox_triage` | `read_message` | read |
| `application_extract` | `list_messages` | read |
| `application_extract` | `read_message` | read |

Nothing else is reachable. There is no send, no label, no archive, no trash.

## Application extract

Give it a date range; get JSON back.

```ts
application_extract_agent({ periodStart: "2026-10-01", periodEnd: "2026-11-01" })
```

```json
{
  "period": { "from": "2026-10-01", "to": "2026-11-01" },
  "checked": 18,
  "applications": [
    {
      "company": "Acme AB",
      "role": "Backend Engineer",
      "location": "Stockholm",
      "appliedAt": "2026-10-14",
      "channel": "ats",
      "sourceUrl": "https://boards.greenhouse.io/acme/jobs/123",
      "messageId": "18f2c1...",
      "confidence": "high",
      "note": null
    }
  ],
  "skipped": [{ "messageId": "18f2b9...", "reason": "saved-search digest, no submission" }]
}
```

`messageId` is required on every row — it is the evidence. Rows that cannot be
read confidently go to `skipped` with a reason instead of being guessed, so the
caller can decide whether to ask.

### Why it is read-only and JSON-only

The rows feed a report a person is legally responsible for. So the expert never
writes, never merges two roles at one company, and returns no prose — only the
object above. Empty fields are `null`, never invented.

## Why inbox drafts are text, not Gmail drafts

Writing a draft into Gmail needs `gmail.compose` — a write scope that also
allows `users.drafts.send`. That turns a read-only expert into an account-access
decision for the operator. So v1 returns draft text and a human pastes it.

Promote it later as a separate expert with `confirm` in its capability list, not
by widening this one.

## Shape

```
src/agents/gmail_agent.ts                 entry agent: triage
src/agents/application_extract_agent.ts   entry agent: extraction, exposed as a tool
src/prompts/gmail_triage.ts               the triage judgment and report shape
src/prompts/application_extract.ts        the extraction contract and JSON shape
src/tools/list_messages.ts                ids only, so a large inbox costs one call
src/tools/get_message.ts                  one message, headers + text, truncated
src/models/…                              one model per prompt
```

Both entry agents are exported in `__meta.entryAgents`, so a runtime or a caller
picks the job explicitly rather than relying on a router to guess.

---

Not affiliated with or endorsed by Google.
