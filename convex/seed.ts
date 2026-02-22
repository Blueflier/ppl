import { internalMutation } from "./_generated/server";

const SEED_EVENT_TYPES = [
  { name: "jazz_jam", displayName: "Jazz Jam", requiredRoles: [{ role: "drummer", min: 1, max: 1 }, { role: "bassist", min: 1, max: 1 }, { role: "pianist", min: 1, max: 1 }], venueType: "indoor_acoustic", hostRequired: false, minAttendees: 3, description: "Pull up with your instrument and jam with other jazz heads. Standards, improv, whatever — just vibes." },
  { name: "open_mic", displayName: "Open Mic", requiredRoles: [{ role: "performer", min: 2 }], venueType: "indoor_public", hostRequired: false, minAttendees: 2, description: "Get on stage and do your thing — comedy, poetry, music, whatever you've been working on." },
  { name: "band_practice", displayName: "Band Practice", requiredRoles: [{ role: "musician", min: 3 }], venueType: "indoor_private", hostRequired: true, minAttendees: 3, description: "Lock in with a crew and rehearse. Bring your gear and come ready to play." },
  { name: "electronic_session", displayName: "Beat Session", requiredRoles: [{ role: "producer", min: 1, max: 1 }, { role: "synth", min: 1 }], venueType: "indoor_private", hostRequired: true, minAttendees: 2, description: "Cook up beats, tweak synths, and geek out on production with other music nerds." },
  { name: "classical_ensemble", displayName: "Classical Ensemble", requiredRoles: [{ role: "violin", min: 1, max: 1 }, { role: "cello", min: 1, max: 1 }, { role: "piano", min: 1, max: 1 }], venueType: "indoor_acoustic", hostRequired: false, minAttendees: 3, description: "Play chamber music with other classically trained musicians. Strings, keys, winds — all welcome." },
  { name: "3v3_basketball", displayName: "3v3 Basketball", requiredRoles: [{ role: "player", min: 6, max: 6 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 6, description: "Run 3v3 half-court games. Fast-paced, competitive, and way less waiting around than full court." },
  { name: "5v5_soccer", displayName: "Pickup Soccer", requiredRoles: [{ role: "player", min: 10, max: 10 }], venueType: "outdoor_field", hostRequired: false, minAttendees: 10, description: "Full-field pickup soccer. Bring cleats, we'll sort teams when everyone shows up." },
  { name: "pickup_volleyball", displayName: "Pickup Volleyball", requiredRoles: [{ role: "player", min: 6 }], venueType: "outdoor", hostRequired: false, minAttendees: 6, description: "Casual pickup volleyball — all skill levels. Just show up and we'll get a game going." },
  { name: "tennis_doubles", displayName: "Tennis Doubles", requiredRoles: [{ role: "player", min: 4, max: 4 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 4, description: "Find a doubles partner and play a few sets. Friendly competition, no league drama." },
  { name: "group_run", displayName: "Group Run", requiredRoles: [{ role: "runner", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3, description: "Lace up and run with a crew. Way more fun than solo miles on the Embarcadero." },
  { name: "cycling_ride", displayName: "Group Ride", requiredRoles: [{ role: "cyclist", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3, description: "Group ride through the city or across the bridge. Bring your bike and good energy." },
  { name: "rock_climbing", displayName: "Climbing Session", requiredRoles: [{ role: "climber", min: 2 }], venueType: "gym_or_outdoor", hostRequired: false, minAttendees: 2, description: "Boulder or rope climb with other climbers. Great for finding belay partners and beta." },
  { name: "yoga_session", displayName: "Yoga Session", requiredRoles: [{ role: "participant", min: 3 }], venueType: "indoor_or_outdoor", hostRequired: false, minAttendees: 3, description: "Flow with a group in a chill setting. All levels, no judgment, just breathe." },
  { name: "founder_roundtable", displayName: "Founder Roundtable", requiredRoles: [{ role: "tech_founder", min: 1 }, { role: "non_tech_founder", min: 1 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4, description: "Small group of founders sharing war stories, advice, and honest feedback. No pitching." },
  { name: "language_exchange", displayName: "Language Exchange", requiredRoles: [{ role: "speaker_lang_a", min: 1 }, { role: "speaker_lang_b", min: 1 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4, description: "Practice a language with native speakers over coffee. You teach yours, they teach theirs." },
  { name: "book_club", displayName: "Book Club", requiredRoles: [{ role: "reader", min: 4 }], venueType: "indoor_private_or_cafe", hostRequired: false, minAttendees: 4, description: "Read something great, then talk about it with people who actually finished the book." },
  { name: "philosophy_debate", displayName: "Philosophy Debate", requiredRoles: [{ role: "participant", min: 4 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4, description: "Dive into big questions with people who love to think out loud. Friendly, not combative." },
  { name: "documentary_screening", displayName: "Doc Night", requiredRoles: [{ role: "viewer", min: 3 }], venueType: "indoor_private", hostRequired: true, minAttendees: 3, description: "Watch a thought-provoking doc together, then unpack it over drinks after." },
  { name: "photography_walk", displayName: "Photo Walk", requiredRoles: [{ role: "photographer", min: 2 }], venueType: "outdoor", hostRequired: false, minAttendees: 2, description: "Wander the city with your camera and other photographers. Golden hour hits different in SF." },
  { name: "creative_writing_circle", displayName: "Writing Circle", requiredRoles: [{ role: "writer", min: 3 }], venueType: "indoor_public", hostRequired: false, minAttendees: 3, description: "Share your writing, get feedback, and riff on prompts with other writers." },
  { name: "hackathon_mini", displayName: "Mini Hackathon", requiredRoles: [{ role: "engineer", min: 1 }, { role: "designer", min: 1 }], venueType: "indoor_coworking", hostRequired: false, minAttendees: 3, description: "Build something cool in a day with designers and devs. No corporate sponsors, just making stuff." },
  { name: "3d_printing_workshop", displayName: "3D Printing Session", requiredRoles: [{ role: "maker", min: 2 }], venueType: "makerspace", hostRequired: false, minAttendees: 2, description: "Design and print stuff at a makerspace. Learn from others or nerd out on your own projects." },
  { name: "board_game_night", displayName: "Board Game Night", requiredRoles: [{ role: "player", min: 4 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4, description: "Crack open some board games and get competitive. Strategy, party games, whatever the group's feeling." },
  { name: "lan_tournament", displayName: "LAN Party", requiredRoles: [{ role: "gamer", min: 4 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4, description: "Bring your rig, plug in, and game with people IRL. Way better than solo queue." },
  { name: "chess_club", displayName: "Chess Club", requiredRoles: [{ role: "player", min: 4 }], venueType: "indoor_public", hostRequired: false, minAttendees: 4, description: "Play chess with people at your level or above. Casual games, maybe some blitz if you're brave." },
  { name: "trivia_night", displayName: "Trivia Night", requiredRoles: [{ role: "team_member", min: 6 }], venueType: "indoor_public", hostRequired: false, minAttendees: 6, description: "Team up and flex your random knowledge. Winning doesn't matter but also it totally does." },
  { name: "hiking_group", displayName: "Group Hike", requiredRoles: [{ role: "hiker", min: 3 }], venueType: "outdoor_trail", hostRequired: false, minAttendees: 3, description: "Hit the trails with a group. Good conversation, good views, good exercise." },
  { name: "urban_sketching", displayName: "Urban Sketching", requiredRoles: [{ role: "artist", min: 3 }], venueType: "outdoor", hostRequired: false, minAttendees: 3, description: "Sketch the city together — architecture, people, street scenes. All mediums welcome." },
  { name: "dinner_party", displayName: "Dinner Party", requiredRoles: [{ role: "participant", min: 4, max: 8 }], venueType: "indoor_private", hostRequired: true, minAttendees: 4, description: "Someone hosts, everyone cooks or brings something. Great food, better conversation." },
  { name: "couples_activity", displayName: "Couples Night", requiredRoles: [{ role: "couple", min: 2 }], venueType: "varies", hostRequired: false, minAttendees: 4, description: "Fun stuff to do with your person and other couples. Double dates but actually good." },
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
