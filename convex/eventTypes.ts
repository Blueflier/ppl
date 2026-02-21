import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { INTEREST_MAP } from "./matchingUtils";
import { getAuthedUserId } from "./authHelpers";

export const getEventTypes = query({
  args: {},
  handler: async (ctx) => {
    const eventTypes = await ctx.db.query("eventTypes").collect();
    return Promise.all(
      eventTypes.map(async (et) => ({
        ...et,
        imageUrl: et.imageStorageId
          ? await ctx.storage.getUrl(et.imageStorageId)
          : null,
      }))
    );
  },
});

export const setEventTypeImage = internalMutation({
  args: {
    eventTypeId: v.id("eventTypes"),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, { eventTypeId, imageStorageId }) => {
    await ctx.db.patch(eventTypeId, { imageStorageId });
  },
});

// Returns gauge counts keyed by eventType name (for trace lookups)
export const getGaugeCountsByEventType = internalQuery({
  args: {},
  handler: async (ctx) => {
    const eventTypes = await ctx.db.query("eventTypes").collect();
    const results: Record<
      string,
      { eventTypeId: string; displayName: string; yesCount: number; noCount: number }
    > = {};

    for (const et of eventTypes) {
      const gauges = await ctx.db
        .query("eventGauges")
        .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", et._id))
        .collect();
      const yesCount = gauges.filter((g) => g.response === "yes").length;
      const noCount = gauges.filter((g) => g.response === "no").length;
      results[et.name] = {
        eventTypeId: et._id as string,
        displayName: et.displayName,
        yesCount,
        noCount,
      };
    }
    return results;
  },
});

export const getEventTypeDetail = query({
  args: { eventTypeId: v.id("eventTypes") },
  handler: async (ctx, { eventTypeId }) => {
    const eventType = await ctx.db.get(eventTypeId);
    if (!eventType) return null;

    const imageUrl = eventType.imageStorageId
      ? await ctx.storage.getUrl(eventType.imageStorageId)
      : null;

    // Gauge stats
    const gauges = await ctx.db
      .query("eventGauges")
      .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", eventTypeId))
      .collect();
    const yesCount = gauges.filter((g) => g.response === "yes").length;
    const noCount = gauges.filter((g) => g.response === "no").length;

    // Gauge timeline (grouped by day)
    const gaugeTimeline: { date: string; yes: number; no: number }[] = [];
    const dayMap = new Map<string, { yes: number; no: number }>();
    for (const g of gauges) {
      const day = new Date(g.timestamp).toISOString().split("T")[0];
      const existing = dayMap.get(day) ?? { yes: 0, no: 0 };
      if (g.response === "yes") existing.yes++;
      else existing.no++;
      dayMap.set(day, existing);
    }
    for (const [date, counts] of Array.from(dayMap.entries()).sort()) {
      gaugeTimeline.push({ date, ...counts });
    }

    // Past events
    const events = await ctx.db
      .query("events")
      .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", eventTypeId))
      .collect();
    const completedEvents = events.filter((e) => e.status === "completed");
    const activeEvent = events.find(
      (e) => e.status === "pending_rsvp" || e.status === "confirmed"
    );

    // Get attendee counts for completed events
    let totalAttendees = 0;
    for (const event of completedEvents) {
      const rsvps = await ctx.db
        .query("rsvps")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("response"), "can_go"))
        .collect();
      totalAttendees += rsvps.length;
    }

    // First mention in ideateLogs
    const allLogs = await ctx.db.query("ideateLogs").collect();
    let firstMention: { timestamp: number; userId: string } | null = null;
    for (const log of allLogs) {
      if (
        log.extractedInterests?.some((i) =>
          eventType.name.toLowerCase().includes(i.toLowerCase()) ||
          i.toLowerCase().includes(eventType.name.replace(/_/g, " ").toLowerCase())
        )
      ) {
        if (!firstMention || log.timestamp < firstMention.timestamp) {
          firstMention = { timestamp: log.timestamp, userId: log.userId as string };
        }
      }
    }

    let firstMentionUser: string | null = null;
    if (firstMention) {
      const user = await ctx.db.get(firstMention.userId as Id<"users">);
      firstMentionUser = user?.name ?? null;
    }

    return {
      ...eventType,
      imageUrl,
      yesCount,
      noCount,
      totalGauges: gauges.length,
      gaugeTimeline,
      completedEventCount: completedEvents.length,
      totalAttendees,
      activeEvent: activeEvent
        ? { _id: activeEvent._id, status: activeEvent.status, scheduledTime: activeEvent.scheduledTime }
        : null,
      firstMention: firstMention
        ? { timestamp: firstMention.timestamp, userName: firstMentionUser }
        : null,
    };
  },
});

// Given a list of canonical interest values, return matching eventTypes
// with gauge counts, active event info, and which interests triggered the match
export const getMatchingEventTypes = query({
  args: { interests: v.array(v.string()) },
  handler: async (ctx, { interests }) => {
    if (interests.length === 0) return [];

    // Map interests to eventType names, tracking which interests matched
    const etToInterests = new Map<string, string[]>();
    const allEts = await ctx.db.query("eventTypes").collect();

    for (const interest of interests) {
      const cv = interest.toLowerCase();
      const direct = INTEREST_MAP[cv];
      if (direct) {
        etToInterests.set(direct, [...(etToInterests.get(direct) ?? []), cv]);
        continue;
      }
      // Fuzzy fallback
      for (const et of allEts) {
        const etReadable = et.name.replace(/_/g, " ");
        if (etReadable.includes(cv) || cv.includes(etReadable)) {
          etToInterests.set(et.name, [...(etToInterests.get(et.name) ?? []), cv]);
        }
      }
    }

    if (etToInterests.size === 0) return [];

    const results = [];

    for (const et of allEts) {
      const matchedInterests = etToInterests.get(et.name);
      if (!matchedInterests) continue;

      // Gauge counts
      const gauges = await ctx.db
        .query("eventGauges")
        .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", et._id))
        .collect();
      const yesCount = gauges.filter((g) => g.response === "yes").length;

      // Active event?
      const events = await ctx.db
        .query("events")
        .withIndex("by_eventTypeId", (q) => q.eq("eventTypeId", et._id))
        .collect();
      const activeEvent = events.find(
        (e) => e.status === "pending_rsvp" || e.status === "confirmed"
      );

      // Venue info for active event
      let venueName: string | undefined;
      let rsvpDeadline: number | undefined;
      let attendeeCount = 0;
      let currentResponse: "can_go" | "unavailable" | null = null;
      if (activeEvent) {
        if (activeEvent.venueId) {
          const venue = await ctx.db.get(activeEvent.venueId);
          venueName = venue?.name;
        }
        rsvpDeadline = activeEvent.rsvpDeadline;
        const rsvps = await ctx.db
          .query("rsvps")
          .withIndex("by_eventId", (q) => q.eq("eventId", activeEvent._id))
          .collect();
        attendeeCount = rsvps.filter((r) => r.response === "can_go").length;
        const userId = await getAuthedUserId(ctx);
        if (userId) {
          const userRsvp = rsvps.find((r) => r.userId === userId);
          currentResponse = (userRsvp?.response as "can_go" | "unavailable") ?? null;
        }
      }

      const imageUrl = et.imageStorageId
        ? await ctx.storage.getUrl(et.imageStorageId)
        : null;

      results.push({
        _id: et._id,
        name: et.name,
        displayName: et.displayName,
        venueType: et.venueType,
        imageUrl,
        interestedCount: yesCount,
        matchedInterests,
        activeEvent: activeEvent
          ? {
              _id: activeEvent._id,
              status: activeEvent.status,
              scheduledTime: activeEvent.scheduledTime,
              matchReason: activeEvent.matchReason,
              venueName,
              rsvpDeadline,
              attendeeCount,
              currentResponse,
            }
          : null,
      });
    }

    return results;
  },
});
