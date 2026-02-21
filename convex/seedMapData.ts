import { internalMutation } from "./_generated/server";

export const seedSampleEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Skip if seedAll already populated venues (check for seed marker)
    const allUsers = await ctx.db.query("users").collect();
    const seedMarker = allUsers.find((u) => u.bio === "__ppl_seed__");
    if (seedMarker) {
      console.log("seedAll already ran — skipping seedSampleEvents to avoid duplicates.");
      return;
    }

    const eventTypes = await ctx.db.query("eventTypes").collect();
    if (eventTypes.length === 0) {
      console.log("No event types found. Run seedEventTypes first.");
      return;
    }

    const etByName = new Map(eventTypes.map((et) => [et.name, et._id]));

    const sfVenues = [
      { name: "Dolores Park", address: "Dolores St & 19th St, SF", lat: 37.7596, lng: -122.4269, venueType: "outdoor_park", isPrivateHome: false },
      { name: "The Fillmore", address: "1805 Geary Blvd, SF", lat: 37.7840, lng: -122.4330, venueType: "music_venue", isPrivateHome: false },
      { name: "Tartine Manufactory", address: "595 Alabama St, SF", lat: 37.7633, lng: -122.4117, venueType: "cafe", isPrivateHome: false },
      { name: "Golden Gate Park", address: "Golden Gate Park, SF", lat: 37.7694, lng: -122.4862, venueType: "outdoor_park", isPrivateHome: false },
      { name: "Zeitgeist", address: "199 Valencia St, SF", lat: 37.7703, lng: -122.4222, venueType: "bar_lounge", isPrivateHome: false },
      { name: "Noisebridge Hackerspace", address: "2169 Mission St, SF", lat: 37.7627, lng: -122.4188, venueType: "makerspace", isPrivateHome: false },
    ];

    const eventDefs = [
      { venueName: "Dolores Park", etName: "group_hike", status: "pending_rsvp" as const, daysOut: 3, reason: "6 hikers across Mission & Castro matched" },
      { venueName: "The Fillmore", etName: "jazz_jam", status: "confirmed" as const, daysOut: 5, reason: "4 jazz musicians in SOMA & Haight matched" },
      { venueName: "Tartine Manufactory", etName: "book_club", status: "pending_rsvp" as const, daysOut: 7, reason: "5 readers in Mission & Hayes Valley" },
      { venueName: "Golden Gate Park", etName: "running_club", status: "confirmed" as const, daysOut: 2, reason: "8 runners across 4 neighborhoods" },
      { venueName: "Zeitgeist", etName: "trivia_night", status: "pending_rsvp" as const, daysOut: 4, reason: "Team of 5 trivia fans in Mission" },
      { venueName: "Noisebridge Hackerspace", etName: "hackathon", status: "confirmed" as const, daysOut: 6, reason: "10 developers for weekend build sprint" },
    ];

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    let created = 0;

    for (const def of eventDefs) {
      const venue = sfVenues.find((v) => v.name === def.venueName)!;
      const etId = etByName.get(def.etName);
      if (!etId) continue;

      const venueId = await ctx.db.insert("venues", {
        name: venue.name,
        address: venue.address,
        venueType: venue.venueType,
        isPrivateHome: venue.isPrivateHome,
        lat: venue.lat,
        lng: venue.lng,
      });

      await ctx.db.insert("events", {
        eventTypeId: etId,
        status: def.status,
        venueId,
        scheduledTime: now + def.daysOut * day,
        matchReason: def.reason,
        rsvpDeadline: now + (def.daysOut - 1) * day,
      });

      created++;
    }

    console.log(`Seeded ${created} map events with venues.`);
  },
});
