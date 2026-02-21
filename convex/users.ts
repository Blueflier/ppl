import { v } from "convex/values";
import { mutation, internalMutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    let profileImageUrl: string | null = null;
    if (user.profileImageId) {
      profileImageUrl = await ctx.storage.getUrl(user.profileImageId);
    }
    return { ...user, profileImageUrl };
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    bio: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, fields) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const updates: Record<string, unknown> = {};
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.age !== undefined) updates.age = fields.age;
    if (fields.bio !== undefined) updates.bio = fields.bio;
    if (fields.neighborhood !== undefined) updates.neighborhood = fields.neighborhood;
    if (fields.username !== undefined) {
      const username = fields.username.toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        throw new Error("Username must be 3-20 chars, alphanumeric + underscores only");
      }
      // Check uniqueness
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", username))
        .first();
      if (existing && existing._id !== userId) {
        throw new Error("Username already taken");
      }
      updates.username = username;
    }
    await ctx.db.patch(userId, updates);
  },
});

export const searchByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
      .first();
    if (!user) return null;
    return { _id: user._id, name: user.name, username: user.username };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveProfileImage = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    // Delete old image if exists
    const user = await ctx.db.get(userId);
    if (user?.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }
    await ctx.db.patch(userId, { profileImageId: storageId });
  },
});

export const updateHostingWillingness = internalMutation({
  args: {
    userId: v.id("users"),
    hostingWillingness: v.union(
      v.literal("willing"),
      v.literal("not_willing"),
      v.literal("depends")
    ),
  },
  handler: async (ctx, { userId, hostingWillingness }) => {
    await ctx.db.patch(userId, { hostingWillingness });
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
