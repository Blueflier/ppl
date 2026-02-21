import { internalMutation } from "./_generated/server";

const SEED_EVENT_TYPES = [
  { name: "jazz_jam", displayName: "Jazz Jam", requiredRoles: [{ role: "drummer", min: 1, max: 1 }, { role: "bassist", min: 1, max: 1 }, { role: "pianist", min: 1, max: 1 }], venueType: "indoor_acoustic", hostRequired: false, minAttendees: 3 },
  { name: "open_mic", displayName: "Open Mic", requiredRoles: [{ role: "performer", min: 2 }], venueType: "indoor_public", hostRequired: false, minAttendees: 2 },
  { name: "band_practice", displayName: "Band Practice", requiredRoles: [{ role: "musician", min: 3 }], venueType: "indoor_private", hostRequired: true, minAttendees: 3 },
  { name: "electronic_session", displayName: "Beat Session", requiredRoles: [{ role: "producer", min: 1, max: 1 }, { role: "synth", min: 1 }], venueType: "indoor_private", hostRequired: true, minAttendees: 2 },
  { name: "classical_ensemble", displayName: "Classical Ensemble", requiredRoles: [{ role: "violin", min: 1, max: 1 }, { role: "cello", min: 1, max: 1 }, { role: "piano", min: 1, max: 1 }], venueType: "indoor_acoustic", hostRequired: false, minAttendees: 3 },
  { name: "3v3_basketball", displayName: "3v3 Basketball", requiredRoles: [{ role: "player", min: 6, max: 6 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 6 },
  { name: "5v5_soccer", displayName: "Pickup Soccer", requiredRoles: [{ role: "player", min: 10, max: 10 }], venueType: "outdoor_field", hostRequired: false, minAttendees: 10 },
  { name: "pickup_volleyball", displayName: "Pickup Volleyball", requiredRoles: [{ role: "player", min: 6 }], venueType: "outdoor", hostRequired: false, minAttendees: 6 },
  { name: "tennis_doubles", displayName: "Tennis Doubles", requiredRoles: [{ role: "player", min: 4, max: 4 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 4 },
  { name: "group_run", displayName: "Group Run", requiredRoles: [{ role: "runner", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3 },
  { name: "cycling_ride", displayName: "Group Ride", requiredRoles: [{ role: "cyclist", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3 },
  { name: "rock_climbing", displayName: "Climbing Session", requiredRoles: [{ role: "climber", min: 2 }], venueType: "gym_or_outdoor", hostRequired: false, minAttendees: 2 },
  { name: "yoga_session", displayName: "Yoga Session", requiredRoles: [{ role: "participant", min: 3 }], venueType: "indoor_or_outdoor", hostRequired: false, minAttendees: 3 },
  { name: "founder_roundtable", displayName: "Founder Roundtable", requiredRoles: [{ role: "tech_founder", min: 1 }, { role: "non_tech_founder", min: 1 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4 },
  { name: "language_exchange", displayName: "Language Exchange", requiredRoles: [{ role: "speaker_lang_a", min: 1 }, { role: "speaker_lang_b", min: 1 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4 },
  { name: "book_club", displayName: "Book Club", requiredRoles: [{ role: "reader", min: 4 }], venueType: "indoor_private_or_cafe", hostRequired: false, minAttendees: 4 },
  { name: "philosophy_debate", displayName: "Philosophy Debate", requiredRoles: [{ role: "participant", min: 4 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4 },
  { name: "documentary_screening", displayName: "Doc Night", requiredRoles: [{ role: "viewer", min: 3 }], venueType: "indoor_private", hostRequired: true, minAttendees: 3 },
  { name: "photography_walk", displayName: "Photo Walk", requiredRoles: [{ role: "photographer", min: 2 }], venueType: "outdoor", hostRequired: false, minAttendees: 2 },
  { name: "creative_writing_circle", displayName: "Writing Circle", requiredRoles: [{ role: "writer", min: 3 }], venueType: "indoor_public", hostRequired: false, minAttendees: 3 },
  { name: "hackathon_mini", displayName: "Mini Hackathon", requiredRoles: [{ role: "engineer", min: 1 }, { role: "designer", min: 1 }], venueType: "indoor_coworking", hostRequired: false, minAttendees: 3 },
  { name: "3d_printing_workshop", displayName: "3D Printing Session", requiredRoles: [{ role: "maker", min: 2 }], venueType: "makerspace", hostRequired: false, minAttendees: 2 },
  { name: "board_game_night", displayName: "Board Game Night", requiredRoles: [{ role: "player", min: 4 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4 },
  { name: "lan_tournament", displayName: "LAN Party", requiredRoles: [{ role: "gamer", min: 4 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4 },
  { name: "chess_club", displayName: "Chess Club", requiredRoles: [{ role: "player", min: 4 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4 },
  { name: "trivia_night", displayName: "Trivia Night", requiredRoles: [{ role: "team_member", min: 6 }], venueType: "indoor_public", hostRequired: false, minAttendees: 6 },
  { name: "hiking_group", displayName: "Group Hike", requiredRoles: [{ role: "hiker", min: 3 }], venueType: "outdoor_trail", hostRequired: false, minAttendees: 3 },
  { name: "urban_sketching", displayName: "Urban Sketching", requiredRoles: [{ role: "artist", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3 },
  { name: "dinner_party", displayName: "Dinner Party", requiredRoles: [{ role: "participant", min: 4, max: 8 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4 },
  { name: "couples_activity", displayName: "Couples Night", requiredRoles: [{ role: "couple", min: 2 }], venueType: "varies", hostRequired: false, minAttendees: 4 },
];

export const seedEventTypes = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const eventType of SEED_EVENT_TYPES) {
      const existing = await ctx.db
        .query("eventTypes")
        .withIndex("by_name", (q) => q.eq("name", eventType.name))
        .first();
      if (!existing) {
        await ctx.db.insert("eventTypes", eventType);
      }
    }
  },
});
