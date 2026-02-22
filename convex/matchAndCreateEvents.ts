import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { VENUE_SUGGESTIONS } from "./matchingUtils";

const GAUGE_THRESHOLD = 3;

export const matchAndCreateEvents = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all event types and check which ones have enough "yes" gauges
    const { eventTypes, activeEvents } = await ctx.runQuery(
      internal.matchAndCreateEventsHelpers.getEventTypesAndActiveEvents
    );

    const activeEventTypeIds = new Set(
      activeEvents.map((e: { eventTypeId: string }) => e.eventTypeId)
    );

    // Get gauge counts for all event types
    const gaugeCounts = await ctx.runQuery(
      internal.eventTypes.getGaugeCountsByEventType
    );

    let createdCount = 0;

    for (const et of eventTypes) {
      // Skip if already has an active event
      if (activeEventTypeIds.has(et._id)) continue;

      // Check gauge count
      const gaugeData = gaugeCounts[et.name];
      const yesCount = gaugeData?.yesCount ?? 0;

      if (yesCount < GAUGE_THRESHOLD) continue;

      // Threshold met — create event with time and venue
      const venueInfo = VENUE_SUGGESTIONS[et.venueType];
      let venueId: string | undefined;
      if (venueInfo) {
        venueId = await ctx.runMutation(
          internal.matchAndCreateEventsHelpers.findOrCreateVenue,
          {
            name: venueInfo.name,
            address: venueInfo.address,
            venueType: et.venueType,
            lat: venueInfo.lat,
            lng: venueInfo.lng,
          }
        );
      }

      // Next Saturday 2pm
      const now = new Date();
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + daysUntilSaturday);
      nextSaturday.setHours(14, 0, 0, 0);
      const scheduledTime = nextSaturday.getTime();

      // Friday 6pm deadline
      const friday = new Date(nextSaturday);
      friday.setDate(nextSaturday.getDate() - 1);
      friday.setHours(18, 0, 0, 0);
      const rsvpDeadline = friday.getTime();

      await ctx.runMutation(
        internal.matchAndCreateEventsHelpers.createEvent,
        {
          eventTypeId: et._id,
          venueId,
          scheduledTime,
          rsvpDeadline,
          matchReason: `${yesCount} people interested in ${et.displayName}`,
        }
      );

      createdCount++;
    }

    console.log(
      `matchAndCreateEvents: created ${createdCount} events (threshold: ${GAUGE_THRESHOLD} yes gauges)`
    );

    return { createdCount };
  },
});
