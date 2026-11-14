import { defineTool } from '@standardagents/spec';
import { z } from 'zod';
import { snapGet, toToolResult } from '../snap-api.js';

export default defineTool({
  description:
    'List the campaigns in one Snapchat Ads ad account, including status, budget, objective and delivery status.',
  args: z.object({
    adAccountId: z.string().min(1).describe('Ad account id from list_ad_accounts'),
  }),
  variables: [
    {
      name: 'SNAP_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token for the Snap Marketing API',
    },
  ],
  execute: async (state, { adAccountId }) => {
    const token = await state.env('SNAP_ACCESS_TOKEN');
    return toToolResult(
      await snapGet(token, `/adaccounts/${encodeURIComponent(adAccountId)}/campaigns`),
    );
  },
});
