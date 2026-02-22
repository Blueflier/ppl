import { v } from "convex/values";
import { mutation, internalMutation, internalQuery, query } from "./_generated/server";
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

// Diagnostic: find users by email and check auth accounts
export const debugUserLookup = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    // Find users with this email
    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    console.log(`Users with email "${email}":`, byEmail.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      username: u.username,
      onboardingComplete: u.onboardingComplete,
    })));

    // Check authAccounts for this email
    const authAccounts = await ctx.db.query("authAccounts").collect();
    const matching = authAccounts.filter((a: any) =>
      a.providerAccountId?.toLowerCase() === email.toLowerCase()
    );
    console.log(`Auth accounts for "${email}":`, matching.map((a: any) => ({
      _id: a._id,
      userId: a.userId,
      provider: a.provider,
      providerAccountId: a.providerAccountId,
    })));

    // Also check the specific user ID
    const targetUser = await ctx.db.get("k97cjnkznshqkhr7es9zqkmv8s81kegm" as any);
    console.log(`User k97c...:`, targetUser ? {
      _id: targetUser._id,
      name: (targetUser as any).name,
      email: (targetUser as any).email,
      onboardingComplete: (targetUser as any).onboardingComplete,
    } : "NOT FOUND");

    // Count friends for each matching user
    for (const u of byEmail) {
      const asReq = await ctx.db.query("friends")
        .withIndex("by_requesterId", (q) => q.eq("requesterId", u._id))
        .collect();
      const asRec = await ctx.db.query("friends")
        .withIndex("by_receiverId", (q) => q.eq("receiverId", u._id))
        .collect();
      console.log(`Friends for ${u._id}: ${asReq.length + asRec.length} (req: ${asReq.length}, rec: ${asRec.length})`);
    }

    // Count friends for k97c user
    const k97cId = "k97cjnkznshqkhr7es9zqkmv8s81kegm" as any;
    const k97cReq = await ctx.db.query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", k97cId))
      .collect();
    const k97cRec = await ctx.db.query("friends")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", k97cId))
      .collect();
    console.log(`Friends for k97c...: ${k97cReq.length + k97cRec.length} (req: ${k97cReq.length}, rec: ${k97cRec.length})`);

    // Check how many friends are "accepted"
    const allFriends = [...k97cReq, ...k97cRec];
    const accepted = allFriends.filter(f => f.status === "accepted");
    const pending = allFriends.filter(f => f.status === "pending");
    console.log(`  Accepted: ${accepted.length}, Pending: ${pending.length}`);

    // Check upcoming events
    const allEvents = await ctx.db.query("events").collect();
    const upcoming = allEvents.filter(
      (e) => e.status === "pending_rsvp" || e.status === "confirmed"
    );
    const now = Date.now();
    console.log(`Total events: ${allEvents.length}`);
    console.log(`Upcoming (pending_rsvp/confirmed): ${upcoming.length}`);
    for (const e of upcoming) {
      const scheduledTime = e.scheduledTime ? new Date(e.scheduledTime).toISOString() : "none";
      const rsvpDeadline = e.rsvpDeadline ? new Date(e.rsvpDeadline).toISOString() : "none";
      const isExpired = e.rsvpDeadline && e.rsvpDeadline < now;
      console.log(`  Event ${e._id}: status=${e.status}, scheduled=${scheduledTime}, deadline=${rsvpDeadline}, expired=${isExpired}`);
    }

    // Count event types
    const eventTypes = await ctx.db.query("eventTypes").collect();
    console.log(`Total event types: ${eventTypes.length}`);
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
