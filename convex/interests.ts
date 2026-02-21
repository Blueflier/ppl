import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const saveOnboardingInterests = mutation({
  args: {
    interests: v.array(
      v.object({
        category: v.union(
          v.literal("hobby"),
          v.literal("problem"),
          v.literal("learning"),
          v.literal("skill")
        ),
        canonicalValue: v.string(),
        rawValue: v.string(),
      })
    ),
  },
  handler: async (ctx, { interests }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const interest of interests) {
      await ctx.db.insert("interests", {
        userId,
        category: interest.category,
        canonicalValue: interest.canonicalValue,
        rawValue: interest.rawValue,
        source: "onboarding",
        isActive: true,
      });
    }
  },
});

export const getUserInterests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("interests")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const deleteInterest = mutation({
  args: { interestId: v.id("interests") },
  handler: async (ctx, { interestId }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const interest = await ctx.db.get(interestId);
    if (!interest || interest.userId !== userId) {
      throw new Error("Interest not found");
    }
    await ctx.db.patch(interestId, { isActive: false });
  },
});
