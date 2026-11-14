# app-agents

Agents for apps. One repo, one npm package per app, one CLI.

Each package is a [Standard Agent](https://standardagentspec.org): a model, a
prompt, tools, and the permission boundary around them, packaged so a runtime
can install and compose it. Agents here are named after the app they are expert
in, because that is how the request arrives — *"can you connect to Snapchat and
pull our campaign numbers?"*

```bash
npx @app-agents/cli list
npx @app-agents/cli search snap
npx @app-agents/cli add snapchat-ads
```

## What's here

| App | Expert | Status | Mode | What it decides |
|---|---|---|---|---|
| [gmail](apps/gmail) | `inbox_triage` | beta | read-only | Which messages need you, why, and what to reply |
| [gmail](apps/gmail) | `application_extract` | beta | read-only | Which jobs you actually applied to in a period, with the email that proves each one |
| [snapchat-ads](apps/snapchat-ads) | `campaign_report` | beta | read-only | What happened in your campaigns and the one change to make first |
| [snapchat-ads](apps/snapchat-ads) | `story_ad_launch` | **gap** | write | Publish a story ad end to end — *not built yet* |

`gap` means the manifest declares the job and its permissions, but there is no
code. That distinction is deliberate: it lets you answer a customer with
"reading, yes, today; publishing, here's what it costs to build" instead of
guessing.

## The naming rule

`github.com/app-agents/<app>` and `npm @app-agents/<app>`.

The app is the handle. The expert is the job. If a vendor has several products
with different scopes, the product goes in the slug (`snapchat-ads`, not
`snapchat`), because the OAuth scope decides what one install can reach.

Full convention, including the package-name rules and why `agent` is a bad
token on npm: [docs/naming.md](docs/naming.md).

## Two rules every app follows

1. **Read-only by default.** An expert starts with read tools. A write tool
   arrives with `confirm` in its capability list and a human gate in the flow —
   never as an ambient permission.
2. **The manifest is the contract.** `apps/<app>/manifest.json` declares every
   capability an expert has, what credential it needs, what the platform will
   demand before it works, and what the vendor's terms say about retention.
   `registry.json` is generated from these, never edited by hand.

```bash
npm run registry   # rebuild registry.json from apps/*/manifest.json
```

## Layout

```
apps/<app>/            one workspace package per app
  src/agents/          entry agent, and the jobs it dispatches to
  src/prompts/         the judgment — this is the part worth reviewing closely
  src/tools/           thin wrappers over the app's API
  src/models/          the model each prompt is coupled to
  manifest.json        capabilities, credentials, gates
packages/core/         manifest types and registry helpers
packages/cli/          list / search / show / auth / add
skills/translate-mcp/  how to turn an MCP server or skill into an app here
```

## Adding an app

Read [docs/adding-an-agent.md](docs/adding-an-agent.md). Short version: copy an
existing app folder, swap the tools, rewrite the prompt, fill in the manifest,
run `npm run registry`.

Most apps start from something that already exists — an MCP server, a CLI, a
skill. That translation is the workflow in
[skills/translate-mcp](skills/translate-mcp/SKILL.md), and it is the fastest
path from "a customer asked" to "here it is".

## Developing

```bash
npm install
npm run typecheck
npm run registry
node packages/cli/dist/index.js list   # after npm run build
npx tsx packages/cli/src/index.ts list # without building
```

## License

MIT. Not affiliated with or endorsed by any of the apps covered here; package
names describe an integration, not a partnership.
