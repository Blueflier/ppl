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

export const addInterest = mutation({
  args: {
    category: v.union(
      v.literal("hobby"),
      v.literal("problem"),
      v.literal("learning"),
      v.literal("skill")
    ),
    rawValue: v.string(),
  },
  handler: async (ctx, { category, rawValue }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const canonicalValue = rawValue.trim().toLowerCase();
    if (!canonicalValue) throw new Error("Value cannot be empty");

    // Check for duplicate
    const existing = await ctx.db
      .query("interests")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("canonicalValue"), canonicalValue),
          q.eq(q.field("isActive"), true)
        )
      )
      .first();
    if (existing) throw new Error("Interest already exists");

    await ctx.db.insert("interests", {
      userId,
      category,
      canonicalValue,
      rawValue: rawValue.trim(),
      source: "onboarding",
      isActive: true,
    });
  },
});

export const getInterestStats = query({
  args: { canonicalValue: v.string() },
  handler: async (ctx, { canonicalValue }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return { othersCount: 0, eventsCount: 0, connectionsCount: 0 };

    // Count other users with same interest
    const allWithInterest = await ctx.db
      .query("interests")
      .withIndex("by_canonicalValue", (q) =>
        q.eq("canonicalValue", canonicalValue)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("userId"), userId)
        )
      )
      .collect();
    const othersCount = new Set(allWithInterest.map((i) => i.userId)).size;

    // Count related events (fuzzy match on eventType displayName)
    const allEventTypes = await ctx.db.query("eventTypes").collect();
    const matchingEventTypes = allEventTypes.filter((et) =>
      et.displayName.toLowerCase().includes(canonicalValue) ||
      canonicalValue.includes(et.name.toLowerCase())
    );
    const eventsCount = matchingEventTypes.length;

    // User's connection count
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const connectionsCount = new Set(
      connections.map((c) => c.connectedUserId)
    ).size;

    return { othersCount, eventsCount, connectionsCount };
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
