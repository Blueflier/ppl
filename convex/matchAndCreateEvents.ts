import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { INTEREST_MAP, VENUE_SUGGESTIONS } from "./matchingUtils";

export const matchAndCreateEvents = internalAction({
  args: {},
  handler: async (ctx) => {
    // 1. Get all active interests (all users)
    const allInterests = await ctx.runQuery(
      internal.matchAndCreateEventsHelpers.getAllActiveInterests
    );

    // 2. Group by canonicalValue → map to eventType via INTEREST_MAP
    const interestGroups: Record<string, Set<string>> = {};
    for (const interest of allInterests) {
      const cv = interest.canonicalValue.toLowerCase();
      const etName = INTEREST_MAP[cv];
      if (!etName) continue;
      if (!interestGroups[etName]) {
        interestGroups[etName] = new Set();
      }
      interestGroups[etName].add(interest.userId);
    }

    // 3. Get all event types and active events
    const { eventTypes, activeEvents } = await ctx.runQuery(
      internal.matchAndCreateEventsHelpers.getEventTypesAndActiveEvents
    );

    const eventTypesByName: Record<
      string,
      {
        _id: string;
        name: string;
        displayName: string;
        venueType: string;
        minAttendees: number;
      }
    > = {};
    for (const et of eventTypes) {
      eventTypesByName[et.name] = et;
    }

    const activeEventTypeIds = new Set(
      activeEvents.map((e: { eventTypeId: string }) => e.eventTypeId)
    );

    let createdCount = 0;

    // 4. For each eventType with enough interested users, create an event
    for (const [etName, userIds] of Object.entries(interestGroups)) {
      const et = eventTypesByName[etName];
      if (!et) continue;

      const userCount = userIds.size;

      // Skip if not enough attendees
      if (userCount < et.minAttendees) continue;

      // Skip if already has an active event
      if (activeEventTypeIds.has(et._id)) continue;

      // Find/create venue
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

      // Pick scheduledTime: next Saturday 2pm PT
      const now = new Date();
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
      const nextSaturday = new Date(now);
      nextSaturday.setDate(now.getDate() + daysUntilSaturday);
      nextSaturday.setHours(14, 0, 0, 0); // 2pm local
      const scheduledTime = nextSaturday.getTime();

      // rsvpDeadline: Friday 6pm PT (day before)
      const friday = new Date(nextSaturday);
      friday.setDate(nextSaturday.getDate() - 1);
      friday.setHours(18, 0, 0, 0);
      const rsvpDeadline = friday.getTime();

      // Insert event
      await ctx.runMutation(
        internal.matchAndCreateEventsHelpers.createEvent,
        {
          eventTypeId: et._id,
          venueId,
          scheduledTime,
          rsvpDeadline,
          matchReason: `${userCount} people interested in ${et.displayName}`,
        }
      );

      createdCount++;
    }

    console.log(
      `matchAndCreateEvents: created ${createdCount} events from ${Object.keys(interestGroups).length} interest groups`
    );

    return { createdCount };
  },
});
