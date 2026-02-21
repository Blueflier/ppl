import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

export const getAllActiveInterests = internalQuery({
  args: {},
  handler: async (ctx) => {
    const interests = await ctx.db.query("interests").collect();
    return interests
      .filter((i) => i.isActive)
      .map((i) => ({
        userId: i.userId as string,
        canonicalValue: i.canonicalValue,
      }));
  },
});

export const getEventTypesAndActiveEvents = internalQuery({
  args: {},
  handler: async (ctx) => {
    const eventTypes = await ctx.db.query("eventTypes").collect();
    const events = await ctx.db.query("events").collect();
    const activeEvents = events.filter(
      (e) => e.status === "pending_rsvp" || e.status === "confirmed"
    );

    return {
      eventTypes: eventTypes.map((et) => ({
        _id: et._id as string,
        name: et.name,
        displayName: et.displayName,
        venueType: et.venueType,
        minAttendees: et.minAttendees,
      })),
      activeEvents: activeEvents.map((e) => ({
        eventTypeId: e.eventTypeId as string,
      })),
    };
  },
});

export const findOrCreateVenue = internalMutation({
  args: {
    name: v.string(),
    address: v.string(),
    venueType: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, { name, address, venueType, lat, lng }) => {
    // Check if venue already exists by name
    const existing = await ctx.db.query("venues").collect();
    const found = existing.find(
      (v) => v.name === name && v.venueType === venueType
    );
    if (found) return found._id as string;

    const id = await ctx.db.insert("venues", {
      name,
      address,
      venueType,
      isPrivateHome: venueType === "private_home",
      lat,
      lng,
    });
    return id as string;
  },
});

export const findEventTypeByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const et = await ctx.db
      .query("eventTypes")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    return et ? (et._id as string) : null;
  },
});

export const createEventType = internalMutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    venueType: v.string(),
  },
  handler: async (ctx, { name, displayName, venueType }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("eventTypes")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (existing) return existing._id as string;

    const id = await ctx.db.insert("eventTypes", {
      name,
      displayName,
      requiredRoles: [{ role: "participant", min: 2 }],
      venueType,
      hostRequired: false,
      minAttendees: 2,
    });
    return id as string;
  },
});

export const createEvent = internalMutation({
  args: {
    eventTypeId: v.string(),
    venueId: v.optional(v.string()),
    scheduledTime: v.number(),
    rsvpDeadline: v.number(),
    matchReason: v.string(),
  },
  handler: async (ctx, { eventTypeId, venueId, scheduledTime, rsvpDeadline, matchReason }) => {
    await ctx.db.insert("events", {
      eventTypeId: eventTypeId as any,
      status: "pending_rsvp",
      venueId: venueId as any,
      scheduledTime,
      rsvpDeadline,
      matchReason,
    });
  },
});
