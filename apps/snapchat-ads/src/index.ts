/**
 * Package entry point: lazy registries of definitions, plus `__meta`.
 */
export const agents = {
  snapchat_ads_agent: async () => (await import('./agents/snapchat_ads_agent.js')).default,
  campaign_report_agent: async () => (await import('./agents/campaign_report_agent.js')).default,
} as const;

export const prompts = {
  snapchat_ads_router: async () => (await import('./prompts/snapchat_ads_router.js')).default,
  campaign_report: async () => (await import('./prompts/campaign_report.js')).default,
} as const;

export const tools = {
  list_organizations: async () => (await import('./tools/list_organizations.js')).default,
  list_ad_accounts: async () => (await import('./tools/list_ad_accounts.js')).default,
  list_campaigns: async () => (await import('./tools/list_campaigns.js')).default,
  get_campaign_stats: async () => (await import('./tools/get_campaign_stats.js')).default,
} as const;

export const models = {
  snap_report_model: async () => (await import('./models/snap_report_model.js')).default,
} as const;

export const __meta = {
  packageId: '@app-agents/snapchat-ads',
  version: '0.1.2',
  entryAgents: ['snapchat_ads_agent'],
  packedAt: 0,
  description: 'Snapchat Ads agent — read campaign performance, say what to change first',
} as const;
