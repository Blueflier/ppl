import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthedUserId } from "./authHelpers";

export const saveRsvp = mutation({
  args: {
    eventId: v.id("events"),
    response: v.union(v.literal("can_go"), v.literal("unavailable")),
  },
  handler: async (ctx, { eventId, response }) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("rsvps")
      .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { response, timestamp: Date.now() });
    } else {
      await ctx.db.insert("rsvps", {
        userId,
        eventId,
        response,
        timestamp: Date.now(),
      });
    }
  },
});

export const getEventsAttendedCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return 0;

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("response"), "can_go"))
      .collect();

    const uniqueEventIds = new Set<string>();
    for (const rsvp of rsvps) {
      const event = await ctx.db.get(rsvp.eventId);
      if (event && event.status === "completed") {
        uniqueEventIds.add(rsvp.eventId);
      }
    }
    return uniqueEventIds.size;
  },
});

export const getFriendEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    if (!userId) return [];

    // Get friend IDs
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
    if (friendIds.length === 0) return [];

    // Get can_go RSVPs from friends, grouped by event
    const eventFriends = new Map<string, string[]>();
    for (const friendId of friendIds) {
      const rsvps = await ctx.db
        .query("rsvps")
        .withIndex("by_userId", (q) => q.eq("userId", friendId))
        .filter((q) => q.eq(q.field("response"), "can_go"))
        .collect();
      const friend = await ctx.db.get(friendId);
      const friendName = friend?.name ?? "Unknown";
      for (const rsvp of rsvps) {
        const key = rsvp.eventId;
        const existing = eventFriends.get(key) ?? [];
        existing.push(friendName);
        eventFriends.set(key, existing);
      }
    }

    // Build event cards
    const results = await Promise.all(
      [...eventFriends.entries()].map(async ([eventId, friendNames]) => {
        const event = await ctx.db.get(eventId as Id<"events">);
        if (!event || (event.status !== "pending_rsvp" && event.status !== "confirmed")) {
          return null;
        }
        const eventType = await ctx.db.get(event.eventTypeId);
        const imageUrl = eventType?.imageStorageId
          ? await ctx.storage.getUrl(eventType.imageStorageId)
          : null;
        const venue = event.venueId ? await ctx.db.get(event.venueId) : null;

        return {
          _id: event._id,
          eventName: eventType?.displayName ?? "Event",
          imageUrl,
          venueName: venue?.name,
          scheduledTime: event.scheduledTime,
          matchReason: event.matchReason,
          friendNames,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});
