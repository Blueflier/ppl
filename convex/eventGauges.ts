import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const saveGauge = mutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    response: v.union(v.literal("yes"), v.literal("no")),
  },
  handler: async (ctx, { eventTypeId, response }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("eventGauges")
      .withIndex("by_userId_eventTypeId", (q) =>
        q.eq("userId", userId).eq("eventTypeId", eventTypeId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { response, timestamp: Date.now() });
    } else {
      await ctx.db.insert("eventGauges", {
        userId,
        eventTypeId,
        response,
        timestamp: Date.now(),
      });
    }
  },
});

export const getUserGauges = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("eventGauges")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});
