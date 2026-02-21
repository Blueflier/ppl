import { query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const getConnectionCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return 0;

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const unique = new Set(connections.map((c) => c.connectedUserId));
    return unique.size;
  },
});

export const getConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const uniqueIds = [...new Set(connections.map((c) => c.connectedUserId))];

    return Promise.all(
      uniqueIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return {
          _id: id,
          name: user?.name ?? "Unknown",
        };
      })
    );
  },
});
