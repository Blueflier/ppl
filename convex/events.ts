import { query } from "./_generated/server";
import { getAuthedUserId } from "./authHelpers";

export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);

    // Fetch events that are pending_rsvp or confirmed
    const allEvents = await ctx.db.query("events").collect();
    const upcoming = allEvents.filter(
      (e) => e.status === "pending_rsvp" || e.status === "confirmed"
    );

    return Promise.all(
      upcoming.map(async (event) => {
        // Join eventType
        const eventType = await ctx.db.get(event.eventTypeId);
        const imageUrl = eventType?.imageStorageId
          ? await ctx.storage.getUrl(eventType.imageStorageId)
          : null;

        // Join venue
        const venue = event.venueId ? await ctx.db.get(event.venueId) : null;

        // Get all RSVPs for attendee count
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
          .collect();
        const attendeeCount = rsvps.filter(
          (r) => r.response === "can_go"
        ).length;

        // Get current user's RSVP
        const userRsvp = userId
          ? rsvps.find((r) => r.userId === userId)
          : null;

        // Get host name
        let hostName: string | undefined;
        if (event.hostUserId) {
          const host = await ctx.db.get(event.hostUserId);
          hostName = host?.name ?? undefined;
        }

        return {
          _id: event._id,
          eventTypeId: event.eventTypeId,
          eventName: eventType?.displayName ?? "Event",
          imageUrl,
          venueName: venue?.name,
          scheduledTime: event.scheduledTime,
          attendeeCount,
          matchReason: event.matchReason,
          hostName,
          rsvpDeadline: event.rsvpDeadline,
          currentResponse: userRsvp?.response ?? null,
        };
      })
    );
  },
});

export const getVenuesWithCoords = query({
  args: {},
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    return venues
      .filter((v) => v.lat !== undefined && v.lng !== undefined)
      .map((v) => ({
        _id: v._id,
        name: v.name,
        venueType: v.venueType,
        lat: v.lat!,
        lng: v.lng!,
      }));
  },
});

export const getMapEvents = query({
  args: {},
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("events").collect();
    const mapEvents = allEvents.filter(
      (e) =>
        (e.status === "pending_rsvp" || e.status === "confirmed") && e.venueId
    );

    const results = await Promise.all(
      mapEvents.map(async (event) => {
        const venue = await ctx.db.get(event.venueId!);
        if (!venue || venue.lat === undefined || venue.lng === undefined)
          return null;

        const eventType = await ctx.db.get(event.eventTypeId);
        const imageUrl = eventType?.imageStorageId
          ? await ctx.storage.getUrl(eventType.imageStorageId)
          : null;

        return {
          _id: event._id,
          eventName: eventType?.displayName ?? "Event",
          imageUrl,
          latitude: venue.lat,
          longitude: venue.lng,
          venueName: venue.name,
          scheduledTime: event.scheduledTime,
        };
      })
    );

    return results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    );
  },
});
