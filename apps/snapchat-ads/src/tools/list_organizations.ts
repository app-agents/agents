import { defineTool } from '@standardagents/spec';
import { z } from 'zod';
import { snapGet, toToolResult } from '../snap-api.js';

export default defineTool({
  description: 'List the Snapchat Ads organizations the token can see. Start here: it gives the ids to pass to list_ad_accounts.',
  variables: [
    {
      name: 'SNAP_ACCESS_TOKEN',
      type: 'secret',
      required: true,
      description: 'OAuth access token for the Snap Marketing API',
    },
  ],
  execute: async (state) => {
    const token = await state.env('SNAP_ACCESS_TOKEN');
    return toToolResult(await snapGet(token, '/me/organizations'));
  },
});
