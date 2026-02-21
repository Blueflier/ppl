import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

const SESSION_ID = "main";

export const getChatHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("ideateLogs")
      .withIndex("by_userId_sessionId", (q) =>
        q.eq("userId", userId).eq("sessionId", SESSION_ID)
      )
      .collect();
  },
});

export const saveIdeateLog = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    extractedInterests: v.optional(v.array(v.string())),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ideateLogs", args);
  },
});

export const saveIdeateInterests = internalMutation({
  args: {
    userId: v.id("users"),
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
  handler: async (ctx, { userId, interests }) => {
    const existing = await ctx.db
      .query("interests")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    const existingCanonicals = new Set(existing.map((i) => i.canonicalValue));

    for (const interest of interests) {
      if (existingCanonicals.has(interest.canonicalValue)) continue;
      await ctx.db.insert("interests", {
        userId,
        category: interest.category,
        canonicalValue: interest.canonicalValue,
        rawValue: interest.rawValue,
        source: "ideate",
        isActive: true,
      });
    }
  },
});
