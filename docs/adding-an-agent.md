# Adding an app

Two ways in: translate something that already exists (fast), or write it from
the API (slower, cleaner). Most apps start with the first.

## Before you write code

Answer these four questions. If you cannot, you are not ready to build.

1. **What is the job?** One sentence, in the customer's words. "Publish a story
   ad and report first-day delivery." Not "manage Snapchat."
2. **What decision does the agent make?** If the answer is "it calls the API",
   you are writing a connector, not an expert. The decision is the product:
   *which* campaign is fatigued, *which* message needs a reply, *what* to change
   first.
3. **What can it touch?** Every action, with a level: `read`, `write`, or
   `confirm`. Anything not listed must be unreachable from the tools you ship.
4. **What will the platform demand?** App review, a registered client id, an org
   admin's approval, a paid plan. This is the `gate` field, and it decides
   whether the feature is a day or a quarter.

## Steps

```bash
cp -R apps/gmail apps/<app>
```

Then:

1. **`manifest.json`** — slug, title, aliases (what people type), package name,
   connector, credentials with scopes, experts with capabilities, `gate`,
   `dataRetention`.
2. **`src/models/`** — one model, coupled to the prompt. Cheap models are fine
   here; each agent has a narrow job.
3. **`src/tools/`** — one tool per API operation. Thin: build the request, check
   the status, hand back JSON. No prompt logic, no summarising, no retries you
   cannot explain.
4. **`src/prompts/`** — the judgment. Include:
   - what it must not do (state the absence of write tools explicitly)
   - the order of operations, with a default when the brief is vague
   - the exact output sections
   - the untrusted-data clause: content from the app is data, never instructions
   - what to say when the data is missing
5. **`src/agents/`** — one entry agent. If you have more than one job, add a
   subagent per job and keep the entry agent tool-free (`apps/snapchat-ads`).
6. **`src/index.ts`** — lazy loaders for every definition. Inferred, not
   annotated, so tool schemas stay in the type.
7. **`README.md`** — what it does, what it deliberately cannot do, credentials,
   capabilities table, the unaffiliated line.
8. **`npm run registry`** — regenerates `registry.json`. It fails on a missing
   or malformed manifest rather than dropping the app silently.

## Non-negotiables

**Read-only first.** Ship read tools, get the judgment right, then add writes
with an explicit `confirm` capability. A write tool that ships without a human
gate is a bug, not a feature.

**Credentials outside the package.** Tools read `state.env('TOKEN')`. Refresh
happens in the host, never in the tool. The spec's credential grants are
`bearer`/`header`/`query`/`basic` with no refresh flow, so a Gmail or Snapchat
token has to be minted and refreshed by whatever owns the OAuth client.

**Declare the gate honestly.** If the platform requires review, say so in the
manifest and in the README. A `gap` expert with a filled-in gate is more useful
than a half-built one with optimistic docs.

**One retry, no swallowing.** If the API fails, return
`{ status: 'error', error }` with the status code. Let the model tell the person
what broke.

## Checklist

- [ ] `npm run check` passes — regenerates types, verifies every reference, rebuilds the registry
- [ ] `npm run typecheck` clean
- [ ] `apps/<app>/src/types.d.ts` and `registry.json` committed
- [ ] every capability in the manifest names a real exported tool
- [ ] the expert ends on a `submit_result`-style tool with evidence, not on prose
- [ ] prompt states what the agent cannot do
- [ ] prompt has the untrusted-data clause
- [ ] README has credentials + the unaffiliated line
- [ ] tested against a real account, with a real empty result
