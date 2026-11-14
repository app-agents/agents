# Gmail — `@app-agents/gmail`

Read an inbox, decide what needs the reader, and write the replies.

The output is a report: what needs a reply (with drafts), what needs action,
what is noise, and anything that tried to instruct the agent from inside an
email. Nothing is sent, archived, or labelled — this expert has no tool that can.

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

Nothing else is reachable. There is no send, no label, no archive, no trash.

## Why drafts are text, not Gmail drafts

Writing a draft into Gmail needs `gmail.compose` — a write scope that also
allows `users.drafts.send`. That turns a read-only expert into an account-access
decision for the operator. So v1 returns draft text in the report and a human
pastes it.

Promote it later as a separate expert with `confirm` in its capability list, not
by widening this one.

## Shape

```
src/agents/gmail_agent.ts      entry agent: prompt on side A, human on side B
src/prompts/gmail_triage.ts    the judgment: what matters, ranked, plus the report shape
src/tools/list_messages.ts     ids only, so a large inbox costs one call
src/tools/get_message.ts       one message, headers + text, truncated
src/models/gmail_triage_model.ts
```

Single job, so the entry agent runs the prompt directly. See
`apps/snapchat-ads` for the router-plus-subagents shape once there are two.

---

Not affiliated with or endorsed by Google.
