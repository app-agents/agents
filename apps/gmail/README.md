# Gmail — `@app-agents/gmail`

An expert in one mailbox. Ask it anything about the mail — what happened, who is
waiting on you, what is still open — and it answers with the message ids it read.

Read-only. No send, no labels, no archive, no trash.

## Install

```bash
npm install @app-agents/gmail
```

## Credentials

`GOOGLE_ACCESS_TOKEN` — an OAuth access token with the
`https://www.googleapis.com/auth/gmail.readonly` scope.

Create an OAuth client in Google Cloud Console, enable the Gmail API, and mint
the token. Refresh happens in your host: the spec's credential grants cover
bearer tokens, not refresh flows.

### The gate

`gmail.readonly` is a restricted scope. For users outside your Workspace:

- Google requires app verification plus a CASA security assessment.
- An OAuth client left in Testing expires refresh tokens after 7 days.

## What ships

Four tools and one agent.

| | |
|---|---|
| `search_messages` | Query → one readable row per message (sender, subject, date, snippet, labels) in a single step |
| `get_thread` | A whole conversation, in order, with text |
| `get_message` | One message, headers and body |
| `submit_result` | The terminal tool: the answer as a validated object with evidence |
| `gmail_agent` | The domain expert. Ends on `submit_result`, never on prose |

## Structured output

The agent does not answer in prose. It ends by calling `submit_result`, whose
arguments are validated by the runtime:

```json
{
  "answer": "Two people are waiting on a reply: …",
  "evidence": [
    { "messageId": "18f2c1…", "subject": "Re: interview", "from": "…",
      "date": "…", "supports": "the interview scheduling question" }
  ],
  "confidence": "high",
  "unresolved": "Could not tell whether the Sep 12 thread was answered."
}
```

Every claim carries a message id. That is the difference between an answer you
can check and an answer you have to trust. See
[docs/structured-output.md](../../docs/structured-output.md) for the rule every
agent in this repo follows.

## Tasks are not in here

This package is Gmail competence, not job-search or inbox-management opinions.
The prompts for specific jobs live in `examples/`, and in the apps that need
them:

- [examples/inbox-triage](../inbox-triage) — what needs a reply, and draft replies
- [examples/application-extract](../application-extract) — dated application rows with evidence

Copy the prompt into your app and call these tools directly. If a task turns out
to be useful to several apps, it graduates to its own package named after the
task, e.g. `@app-agents/job-applications` — never bolted onto the Gmail package.

## Shape

```
src/tools/search_messages.ts   query -> rows, headers included
src/tools/get_thread.ts        a conversation as one object
src/tools/get_message.ts       one message, text truncated
src/tools/submit_result.ts     the terminal, validated result
src/prompts/gmail.ts           domain knowledge: query syntax, limits, trust
src/agents/gmail_agent.ts      stopTool: submit_result
```

---

Not affiliated with or endorsed by Google.
