import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

const SESSION_ID = "main";

// ── Trace queries/mutations ──

export const getTraces = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("ideateTraces")
      .withIndex("by_userId_sessionId", (q) =>
        q.eq("userId", userId).eq("sessionId", SESSION_ID)
      )
      .collect();
  },
});

export const saveIdeateTrace = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    traceType: v.union(
      v.literal("searching_people"),
      v.literal("found_match"),
      v.literal("pinging_user"),
      v.literal("searching_venue"),
      v.literal("found_venue"),
      v.literal("summary")
    ),
    content: v.string(),
    metadata: v.optional(
      v.object({
        matchedCount: v.optional(v.number()),
        eventTypeName: v.optional(v.string()),
        venueName: v.optional(v.string()),
        venueLocation: v.optional(
          v.object({ lat: v.number(), lng: v.number() })
        ),
      })
    ),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ideateTraces", args);
  },
});

export const clearTraces = internalMutation({
  args: { userId: v.id("users"), sessionId: v.string() },
  handler: async (ctx, { userId, sessionId }) => {
    const traces = await ctx.db
      .query("ideateTraces")
      .withIndex("by_userId_sessionId", (q) =>
        q.eq("userId", userId).eq("sessionId", sessionId)
      )
      .collect();
    for (const trace of traces) {
      await ctx.db.delete(trace._id);
    }
  },
});

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

export const clearChat = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return;
    const logs = await ctx.db
      .query("ideateLogs")
      .withIndex("by_userId_sessionId", (q) =>
        q.eq("userId", userId).eq("sessionId", SESSION_ID)
      )
      .collect();
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }
    // Also clear traces
    const traces = await ctx.db
      .query("ideateTraces")
      .withIndex("by_userId_sessionId", (q) =>
        q.eq("userId", userId).eq("sessionId", SESSION_ID)
      )
      .collect();
    for (const trace of traces) {
      await ctx.db.delete(trace._id);
    }
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
