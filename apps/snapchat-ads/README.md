# Snapchat Ads — `@app-agents/snapchat-ads`

Read campaign performance and say what to change first.

This is the worked example of the repo's shape: an entry agent that holds no
tools, dispatching to experts that each do one job.

```
snapchat_ads_agent          entry point — installed, approved, called
  └── campaign_report       reads delivery + spend, ranks one change
```

## Install

```bash
npm install @app-agents/snapchat-ads
```

## Experts

| Expert | Status | What it does | Mode |
|---|---|---|---|
| `campaign_report` | beta | Reads campaigns and stats, says what happened and what to change first | read-only |
| `story_ad_launch` | **gap** | Publishes a story ad end to end, reports first-day delivery | not built |

`story_ad_launch` is declared and gated but not implemented. That is the point:
the manifest tells you what it would cost before anyone promises it to a
customer. Snap's own Ads MCP is read-only with writes "planned", so publishing
goes through the Marketing API directly, with your own app registration.

## Credentials

`SNAP_ACCESS_TOKEN` — a Snap Marketing API access token.

Register an app in the Snap Developer Portal, add the Marketing API, complete
OAuth for the advertiser. Snap reviews access before it works in production.

### The gate, in two halves

- **Read-only is self-service.** Snap's Ads MCP needs an org admin to approve the
  agent on first sign-in, and each member then authorises their own access.
  Approval and client ids are **per agent** — which is why this package is one
  agent per app rather than one per job.
- **Writing needs more.** Your own Snap app registration, API access review, and
  a client id registered per agent. That is the difference between a day and a
  quarter.

## Capabilities

| Expert | Action | Level |
|---|---|---|
| `campaign_report` | `list_organizations` | read |
| `campaign_report` | `list_ad_accounts` | read |
| `campaign_report` | `list_campaigns` | read |
| `campaign_report` | `read_campaign_stats` | read |

Planned, not reachable: `create_campaign`, `create_ad_squad`, `upload_creative`
(write), `publish_ad` (confirm).

## Notes

- Micro-currency: Snap returns spend in millionths. The prompt divides by
  1,000,000 before reporting.
- Stats field names are Snap's own and are passed through, so a metric Snap adds
  works without a package release.
- Every endpoint shares one request envelope (`request_status`, `request_id`,
  entity list) handled in `src/snap-api.ts`.

## Shape

```
src/agents/snapchat_ads_agent.ts     entry agent, no tools, one subagent
src/agents/campaign_report_agent.ts  the job, exposed as a tool
src/prompts/snapchat_ads_router.ts   routes, refuses what it cannot do
src/prompts/campaign_report.ts       the judgment and the report shape
src/tools/*.ts                       four read operations
src/snap-api.ts                      one place for the envelope and base URL
```

---

Not affiliated with or endorsed by Snap Inc.
