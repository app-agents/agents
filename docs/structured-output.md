# Structured output

Every agent in this repo ends its turn by calling a terminal tool whose
arguments are validated. No agent answers in prose.

This is not a style preference. An agent that returns prose is only as
trustworthy as the reader's willingness to re-check it. An agent that returns a
validated object with evidence attached can be checked mechanically, stored,
diffed and audited — and it fails loudly instead of confidently.

## The rules

**1. End on a tool, not on text.**

```ts
sideA: {
  prompt: 'gmail',
  stopTool: 'submit_result',
  stopToolResponseProperty: 'result',
  maxSteps: 16,
}
```

`stopTool` ends the turn when the named tool is called, and
`stopToolResponseProperty` extracts that argument as the outcome. Inside a
subagent, `sessionStop` does the same for the whole session.

**2. Schema the payload.**

The terminal tool's `args` is a zod schema. The runtime validates before the
caller sees anything, so a malformed answer is an error, not a surprise three
layers up.

**3. Cite evidence for every claim.**

Any agent that reads third-party content must return the ids it read, each tied
to the specific claim it supports. `[messageId, documentId, recordId]` —
whatever the app's unit of evidence is. An empty evidence list is an honest
"nothing found"; a confident answer with no evidence is a bug.

**4. Report confidence and gaps.**

`confidence: high | medium | low` and `unresolved: string | null`. The second
one is the important one: agents default to sounding finished. Make "what I
could not determine" a required field.

**5. Never ask for JSON in the prompt.**

Instructions like "return JSON" or "wrap in a code fence" produce output that
parses most of the time, which is the worst reliability profile: it works in
testing and fails on the one input that matters. Use a tool call instead — the
model gets a schema, the runtime validates it, and there is nothing to parse.

## What the envelope looks like

```ts
z.object({
  answer: z.string(),                 // what it found, and what it means
  evidence: z.array(z.object({        // one entry per source relied on
    messageId: z.string(),
    subject: z.string().nullable(),
    from: z.string().nullable(),
    date: z.string().nullable(),
    supports: z.string(),             // the specific claim
  })),
  confidence: z.enum(['high', 'medium', 'low']),
  unresolved: z.string().nullable(),
})
```

Apps extend it with their own fields. The shape that matters is
`answer + evidence + confidence + gaps` — a caller can render it, store it, or
refuse it without reading a word of prose.

## Why apps get their own task prompts

The envelope is app competence. The *task* — which rows a job application
produces, how to dedupe against an `applications` table, what counts as
reportable — belongs to the app, next to the schema it writes into. See
[adding-an-agent.md](adding-an-agent.md).
