import { query } from "./_generated/server";

export const getEventTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("eventTypes").collect();
  },
});
