import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const sendFriendRequest = mutation({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username.toLowerCase()))
      .first();
    if (!target) throw new Error("User not found");
    if (target._id === userId) throw new Error("Cannot add yourself");

    // Check for existing friendship in either direction
    const existing1 = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("receiverId"), target._id))
      .first();
    if (existing1) throw new Error("Friend request already exists");

    const existing2 = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", target._id))
      .filter((q) => q.eq(q.field("receiverId"), userId))
      .first();
    if (existing2) throw new Error("Friend request already exists");

    await ctx.db.insert("friends", {
      requesterId: userId,
      receiverId: target._id,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friends") },
  handler: async (ctx, { friendshipId }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship || friendship.receiverId !== userId) {
      throw new Error("Request not found");
    }
    await ctx.db.patch(friendshipId, { status: "accepted" });
  },
});

export const declineFriendRequest = mutation({
  args: { friendshipId: v.id("friends") },
  handler: async (ctx, { friendshipId }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(friendshipId);
    if (!friendship || friendship.receiverId !== userId) {
      throw new Error("Request not found");
    }
    await ctx.db.delete(friendshipId);
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];

    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asReceiver = await ctx.db
      .query("friends")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...asRequester.map((f) => f.receiverId),
      ...asReceiver.map((f) => f.requesterId),
    ];

    return Promise.all(
      friendIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return {
          _id: id,
          name: user?.name ?? "Unknown",
          username: user?.username,
        };
      })
    );
  },
});

export const getFriendCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return 0;

    const asRequester = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const asReceiver = await ctx.db
      .query("friends")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    return asRequester.length + asReceiver.length;
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];

    const pending = await ctx.db
      .query("friends")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      pending.map(async (req) => {
        const user = await ctx.db.get(req.requesterId);
        return {
          _id: req._id,
          requesterName: user?.name ?? "Unknown",
          requesterUsername: user?.username,
        };
      })
    );
  },
});
