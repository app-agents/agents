import { defineTool } from '@standardagents/spec';
import { z } from 'zod';
import { snapGet, toToolResult } from '../snap-api.js';

/**
 * Field names are Snap's own. They are passed through rather than validated
 * here, so a metric Snap adds keeps working without a package release.
 */
export default defineTool({
  description:
    'Fetch performance stats for one Snapchat Ads campaign over a date range. Field names follow Snap\'s reference, e.g. impressions,swipes,spend.',
  args: z.object({
    campaignId: z.string().min(1).describe('Campaign id from list_campaigns'),
    fields: z
      .string()
      .min(1)
      .default('impressions,swipes,spend')
      .describe('Comma-separated Snap metric names'),
    granularity: z.enum(['TOTAL', 'DAY', 'HOUR']).default('TOTAL').describe('Bucket size'),
    startTime: z.string().describe('ISO 8601 start time, e.g. 2026-11-01T00:00:00.000Z'),
    endTime: z.string().describe('ISO 8601 end time, e.g. 2026-11-08T00:00:00.000Z'),
  }),
  variables: [
    {
      name: 'SNAP_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token for the Snap Marketing API',
    },
  ],
  execute: async (state, { campaignId, fields, granularity, startTime, endTime }) => {
    const token = await state.env('SNAP_ACCESS_TOKEN');
    const query = new URLSearchParams({ fields, granularity, start_time: startTime, end_time: endTime });
    return toToolResult(
      await snapGet(token, `/campaigns/${encodeURIComponent(campaignId)}/stats?${query.toString()}`),
    );
  },
});
