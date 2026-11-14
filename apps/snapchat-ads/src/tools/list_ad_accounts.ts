import { defineTool } from '@standardagents/spec';
import { z } from 'zod';
import { snapGet, toToolResult } from '../snap-api.js';

export default defineTool({
  description: 'List the ad accounts in one Snapchat Ads organization. Returns the ad account ids used by list_campaigns.',
  args: z.object({
    organizationId: z.string().min(1).describe('Organization id from list_organizations'),
  }),
  variables: [
    {
      name: 'SNAP_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token for the Snap Marketing API',
    },
  ],
  execute: async (state, { organizationId }) => {
    const token = await state.env('SNAP_ACCESS_TOKEN');
    return toToolResult(
      await snapGet(token, `/organizations/${encodeURIComponent(organizationId)}/adaccounts`),
    );
  },
});
