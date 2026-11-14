# Naming

The request always arrives with an app name in it: *"can you connect to
Snapchat and pull our campaign numbers?"* So the app is the handle, and every
name in this repo is derived from it.

## The rule

| Thing | Pattern | Example |
|---|---|---|
| Repo folder | `apps/<app>` | `apps/snapchat-ads` |
| GitHub URL | `github.com/app-agents/<app>` | `github.com/app-agents/snapchat-ads` |
| npm package | `@app-agents/<app>` | `@app-agents/snapchat-ads` |
| Display name | `<App> — <Job>` | `Snapchat Ads — Campaign report` |
| Entry agent | `<app>_agent` | `snapchat_ads_agent` |
| Expert id | `snake_case`, verb-ish | `campaign_report`, `story_ad_launch` |

The **app slug is the lookup key**. `registry.json` is keyed by it, the CLI
resolves it, and `aliases` exist only to catch how people actually type
("snap", "insta", "fb", "google mail").

## Why one package per app, not per job

An app agent is the installable unit and the unit a platform approves. Snap
registers a client id per agent and an org admin approves each agent
separately; the same is true wherever a vendor gates access per integration.
Shipping one package per job multiplies that consent dance by the number of
jobs.

So: **one package per app, jobs inside it**. The entry agent routes; each job is
a subagent with its own thread. `apps/snapchat-ads` is the worked example —
`snapchat_ads_agent` holds no tools and dispatches to `campaign_report_agent`.

This is also why "app agent" is a better unit than "skill": a skill is
instructions with no boundary. An app agent carries the credential, the
capability list, and the platform gate with it.

## Product suffix, when a vendor has several

Use the product in the slug whenever the OAuth scopes differ:

- `snapchat-ads`, not `snapchat` (Ads has its own API and review process)
- `google-calendar` and `gmail`, not `google` (separate scopes, separate grants)
- `stripe` is fine on its own — one API, one key

If two products share one credential and one API, one slug is correct. The test
is the credential, not the marketing.

## Package names: don't end in `agent`

`agent` is the most polluted token on npm. It belongs to `http.Agent` and the
proxy-agent family. Searches prove it:

```
npm search "snapchat agent"  →  agent-base, https-proxy-agent, socks-proxy-agent, http-proxy-agent
npm search "gmail agent"     →  gmail-tester, @googleapis/gmail, … gmail-agent at position 8
npm search "gmail mcp"       →  eight focused *-gmail-mcp packages, relevance 411 → 234
```

So:

- `@app-agents/gmail` — not `@app-agents/gmail-agent`.
- Put the category in the **scope**, the app in the **name**. In a
  `package.json` that reads `"@app-agents/gmail": "^0.1.0"`, which is
  self-explanatory.
- Keep `mcp` in `keywords` and in the connector description. It is the one noun
  in this space that means "connection to an app" and it still ranks cleanly.

## Trademarks

The slug is a factual integration name, not a claim of partnership. So:

- Package scope is ours (`@app-agents/*`), never the vendor's.
- No vendor logos in the repo.
- Every app README carries one line: not affiliated with or endorsed by the
  vendor.
- Display names describe an integration ("Snapchat Ads — Campaign report"),
  never an endorsement.

## Discovery, in one place

GitHub search for `<app> agent` is empty for most apps — `snapchat agent`
returns ten results and all of them are junk. That is the opportunity: each
obscure app you cover is a query with no competition, while popular apps
(`gmail agent`, 4.5k results) are already lost to giants.

The registry is therefore the real discovery surface, not search. `llms.txt`
and `registry.json` exist so an agent never has to search at all.
