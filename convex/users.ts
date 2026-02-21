import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    age: v.optional(v.number()),
  },
  handler: async (ctx, fields) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const updates: Record<string, unknown> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.age !== undefined) updates.age = fields.age;
    await ctx.db.patch(userId, updates);
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { onboardingComplete: true });
  },
});
