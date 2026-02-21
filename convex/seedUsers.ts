import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ═══════════════════════════════════════════════════════
// Random pools for generating realistic synthetic users
// ═══════════════════════════════════════════════════════

const FIRST_NAMES = [
  "Maya", "Dante", "Priya", "Leo", "Suki", "Marcus", "Alex", "Jordan", "Sam", "Nia",
  "Kai", "Dev", "Olivia", "Ethan", "Zara", "Finn", "Luna", "Tyler", "Emma", "Chris",
  "Ava", "Blake", "Sophie", "Ryan", "Mei", "Jake", "Hana", "Oscar", "Lily", "Aiden",
  "Chloe", "Nathan", "Isabel", "James", "Victoria", "Michael", "Sophia", "Derek",
  "Riley", "Cameron", "Jasper", "Willow", "Phoenix", "Mia", "Oliver", "Harper",
  "Charlotte", "Sebastian", "Audrey", "Diego", "Valentina", "Tomás", "Anika", "Reuben",
  "Selena", "Kwame", "Rosa", "Jin", "Farah", "Tara", "Liam", "Zoe", "Ivan", "Amara",
  "Felix", "Milo", "Iris", "Theo", "Gia", "Quinn", "Max", "Nadia", "Drew", "Claire",
  "Yuki", "Brendan", "Ling", "Oleg", "Mika", "Ronan", "Sterling", "Vivienne", "Graham",
  "Freya", "Mateo", "Ivy", "Nico", "Lucia", "Marco", "Stella", "Nina", "Jasmine",
  "Owen", "Leila", "Andre", "Layla", "Ray", "Noor", "Dex", "Sage", "Bodhi", "Rain",
  "Ezra", "Wren", "Arlo", "Penelope", "Ash", "Skyler", "Jamie", "Amelie", "Henry",
  "Isabelle", "Ella", "Noah", "Aria", "Caleb", "Sienna", "Miles", "Piper", "Jude",
  "Hazel", "Atlas", "Cora", "Ezekiel", "Nola", "Rowan", "Indie", "Soren", "Thea",
  "Kian", "Vera", "Ellis", "Margot", "Idris", "Lena", "Oren", "Clara", "Zain", "Esme",
];

const LAST_NAMES = [
  "Chen", "Reyes", "Nair", "Alvarez", "Yamamoto", "Jones", "Kim", "Lee", "Patel", "Brooks",
  "Tanaka", "Sharma", "Park", "Moore", "Ahmed", "O'Brien", "Rivera", "Harrison", "Watson",
  "Nguyen", "Johnson", "Foster", "Cooper", "Lin", "Zhang", "Murphy", "Choi", "Torres",
  "Wright", "Reed", "Santos", "Grant", "Voss", "Clark", "Morales", "Cruz", "Herrera",
  "Asante", "Martinez", "Hassan", "Singh", "Williams", "Petrov", "Okafor", "Huang",
  "Brennan", "Nakamura", "Rossi", "Taylor", "Dubois", "Koval", "Mitchell", "Sato",
  "Walsh", "Zhao", "Ivanov", "Suzuki", "Kelly", "Stone", "Moreau", "Fontaine", "Romano",
  "DeLuca", "Ricci", "Bianchi", "Volkov", "Wu", "McCarthy", "Nazari", "Gallagher",
  "Washington", "Dominguez", "Ali", "Monroe", "Baker", "Kimball", "Calloway", "Finch",
  "Hart", "Ellis", "Tran", "Anderson", "Silva", "Chang", "Bauer", "Fox", "Waters",
  "Hernandez", "Green", "Moon", "Hyde", "Diaz", "Okonkwo", "Johansson", "Kapoor",
  "Fernandez", "Liu", "Hoffman", "Adeyemi", "Bergström", "Gupta", "Novak",
];

const NEIGHBORHOODS = [
  "Mission", "Mission", "Mission", // weighted heavier — popular area
  "SOMA", "SOMA",
  "Hayes Valley", "Hayes Valley",
  "Marina", "Marina",
  "Sunset", "Sunset",
  "Richmond",
  "Nob Hill",
  "Castro",
  "Haight",
  "Dogpatch",
  "Pacific Heights",
  "Potrero Hill",
  "North Beach",
  "Bernal Heights",
  "Civic Center",
  "Inner Richmond",
  "Noe Valley",
  "Glen Park",
  "Cole Valley",
  "Lower Haight",
];

// Interests grouped by popularity (higher weight = more users will have them)
const INTEREST_POOLS: { interest: string; weight: number }[] = [
  // Very popular (weight 5)
  { interest: "hiking", weight: 5 },
  { interest: "cooking", weight: 5 },
  { interest: "yoga", weight: 5 },
  { interest: "running", weight: 5 },
  { interest: "photography", weight: 5 },
  // Popular (weight 4)
  { interest: "basketball", weight: 4 },
  { interest: "book club", weight: 4 },
  { interest: "dinner party", weight: 4 },
  { interest: "wine tasting", weight: 4 },
  { interest: "painting", weight: 4 },
  // Medium (weight 3)
  { interest: "rock climbing", weight: 3 },
  { interest: "hackathon", weight: 3 },
  { interest: "board games", weight: 3 },
  { interest: "trivia night", weight: 3 },
  { interest: "meditation", weight: 3 },
  { interest: "surfing", weight: 3 },
  { interest: "creative writing", weight: 3 },
  { interest: "pottery", weight: 3 },
  // Niche (weight 2)
  { interest: "jazz piano", weight: 2 },
  { interest: "jazz drums", weight: 2 },
  { interest: "music production", weight: 2 },
  { interest: "machine learning", weight: 2 },
  { interest: "3d printing", weight: 2 },
  { interest: "woodworking", weight: 2 },
  { interest: "classical ensemble", weight: 2 },
  { interest: "salsa dancing", weight: 2 },
  { interest: "volleyball", weight: 2 },
  { interest: "gardening", weight: 2 },
  { interest: "brewing", weight: 2 },
  // Community / social
  { interest: "pop culture", weight: 3 },
  { interest: "politics", weight: 2 },
  { interest: "thai food", weight: 3 },
  { interest: "homelessness", weight: 2 },
  { interest: "homelessness solutions", weight: 2 },
  { interest: "new friends", weight: 4 },
  { interest: "eating chicken wing competition", weight: 1 },
  // Very niche (weight 1)
  { interest: "game dev", weight: 1 },
  { interest: "skateboarding", weight: 1 },
  { interest: "startup networking", weight: 1 },
  { interest: "graphic design", weight: 1 },
  { interest: "drag brunch", weight: 1 },
  { interest: "dim sum cooking", weight: 1 },
];

// Build weighted pool
const WEIGHTED_INTERESTS: string[] = [];
for (const { interest, weight } of INTEREST_POOLS) {
  for (let i = 0; i < weight; i++) WEIGHTED_INTERESTS.push(interest);
}

const INTEREST_TO_EVENT_TYPE: Record<string, string> = {
  "jazz piano": "jazz_jam", "jazz drums": "jazz_jam", "music production": "jazz_jam",
  "basketball": "pickup_basketball", "hiking": "group_hike", "running": "running_club",
  "rock climbing": "climbing_session", "dinner party": "dinner_party",
  "cooking": "dinner_party", "dim sum cooking": "dinner_party",
  "book club": "book_club", "wine tasting": "wine_tasting",
  "pottery": "pottery_workshop", "painting": "painting_session",
  "yoga": "yoga_session", "meditation": "yoga_session",
  "photography": "photo_walk", "hackathon": "hackathon",
  "machine learning": "hackathon", "game dev": "hackathon",
  "3d printing": "maker_workshop", "woodworking": "maker_workshop",
  "board games": "board_game_night", "trivia night": "trivia_night",
  "creative writing": "writing_workshop", "classical ensemble": "classical_ensemble",
  "salsa dancing": "dance_social", "volleyball": "pickup_volleyball",
  "surfing": "surf_session", "skateboarding": "skate_session",
  "startup networking": "startup_mixer", "gardening": "garden_meetup",
  "brewing": "homebrew_club", "graphic design": "design_critique",
  "drag brunch": "drag_brunch",
};

// ── Venues ──
const SEED_VENUES = [
  { name: "The Jam Spot", address: "3192 24th St, SF", venueType: "music_studio", lat: 37.7525, lng: -122.4147, isPrivateHome: false },
  { name: "Dolores Park", address: "Dolores St & 19th St, SF", venueType: "outdoor_park", lat: 37.7596, lng: -122.4269, isPrivateHome: false },
  { name: "Mission Cliffs", address: "2295 Harrison St, SF", venueType: "climbing_gym", lat: 37.7603, lng: -122.4130, isPrivateHome: false },
  { name: "Noisebridge", address: "2169 Mission St, SF", venueType: "makerspace", lat: 37.7627, lng: -122.4189, isPrivateHome: false },
  { name: "The Bindery", address: "1727 Haight St, SF", venueType: "community_space", lat: 37.7692, lng: -122.4518, isPrivateHome: false },
  { name: "GGP Polo Fields", address: "Middle Dr W, SF", venueType: "outdoor_field", lat: 37.7694, lng: -122.4936, isPrivateHome: false },
  { name: "Spark Social SF", address: "601 Mission Bay Blvd, SF", venueType: "food_hall", lat: 37.7713, lng: -122.3909, isPrivateHome: false },
  { name: "SF Community Music Center", address: "544 Capp St, SF", venueType: "music_venue", lat: 37.7584, lng: -122.4180, isPrivateHome: false },
  { name: "The Interval", address: "2 Marina Blvd, SF", venueType: "bar_lounge", lat: 37.8066, lng: -122.4316, isPrivateHome: false },
  { name: "Potrero Hill Rec Center", address: "801 Arkansas St, SF", venueType: "rec_center", lat: 37.7573, lng: -122.3985, isPrivateHome: false },
  { name: "City Lights Books", address: "261 Columbus Ave, SF", venueType: "bookstore", lat: 37.7976, lng: -122.4065, isPrivateHome: false },
  { name: "Ocean Beach", address: "Great Highway, SF", venueType: "beach", lat: 37.7594, lng: -122.5107, isPrivateHome: false },
  { name: "NEMA Rooftop", address: "8 10th St, SF", venueType: "rooftop_lounge", lat: 37.7756, lng: -122.4141, isPrivateHome: false },
  { name: "Hayes Valley Art Works", address: "432 Octavia St, SF", venueType: "gallery", lat: 37.7764, lng: -122.4244, isPrivateHome: false },
  { name: "Crissy Field", address: "603 Mason St, SF", venueType: "trailhead", lat: 37.8039, lng: -122.4644, isPrivateHome: false },
  { name: "SOMA Courts", address: "428 11th St, SF", venueType: "outdoor_court", lat: 37.7706, lng: -122.4129, isPrivateHome: false },
  { name: "The Midway", address: "900 Marin St, SF", venueType: "dance_studio", lat: 37.7527, lng: -122.3922, isPrivateHome: false },
  { name: "Fort Mason Garden", address: "2 Marina Blvd, SF", venueType: "community_garden", lat: 37.8051, lng: -122.4300, isPrivateHome: false },
  { name: "Barebottle Brewing", address: "1525 Cortland Ave, SF", venueType: "brewery", lat: 37.7394, lng: -122.4125, isPrivateHome: false },
  { name: "Galvanize SOMA", address: "44 Tehama St, SF", venueType: "coworking_space", lat: 37.7862, lng: -122.4039, isPrivateHome: false },
  { name: "SoMa Skate Plaza", address: "7th & Harrison, SF", venueType: "skatepark", lat: 37.7755, lng: -122.4078, isPrivateHome: false },
  { name: "Pacific Heights Home", address: "Pacific Heights, SF", venueType: "private_home", lat: 37.7925, lng: -122.4382, isPrivateHome: true },
  { name: "Café Réveille", address: "4076 18th St, SF", venueType: "cafe", lat: 37.7609, lng: -122.4350, isPrivateHome: false },
  { name: "Oasis SF", address: "298 11th St, SF", venueType: "restaurant", lat: 37.7720, lng: -122.4133, isPrivateHome: false },
  { name: "Rainbow Grocery", address: "1745 Folsom St, SF", venueType: "community_kitchen", lat: 37.7708, lng: -122.4151, isPrivateHome: false },
];

const EVENT_TYPE_DEFS = [
  { name: "jazz_jam", displayName: "Jazz Jam", requiredRoles: [{ role: "musician", min: 3, max: 8 }], venueType: "music_studio", hostRequired: false, minAttendees: 3 },
  { name: "pickup_basketball", displayName: "Pickup Basketball", requiredRoles: [{ role: "player", min: 6, max: 10 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 6 },
  { name: "group_hike", displayName: "Group Hike", requiredRoles: [{ role: "hiker", min: 4, max: 15 }], venueType: "trailhead", hostRequired: false, minAttendees: 4 },
  { name: "running_club", displayName: "Running Club", requiredRoles: [{ role: "runner", min: 3, max: 20 }], venueType: "outdoor_park", hostRequired: false, minAttendees: 3 },
  { name: "climbing_session", displayName: "Climbing Session", requiredRoles: [{ role: "climber", min: 2, max: 6 }], venueType: "climbing_gym", hostRequired: false, minAttendees: 2 },
  { name: "dinner_party", displayName: "Dinner Party", requiredRoles: [{ role: "host", min: 1, max: 1 }, { role: "guest", min: 3, max: 8 }], venueType: "private_home", hostRequired: true, minAttendees: 4 },
  { name: "book_club", displayName: "Book Club", requiredRoles: [{ role: "reader", min: 4, max: 10 }], venueType: "cafe", hostRequired: false, minAttendees: 4 },
  { name: "wine_tasting", displayName: "Wine Tasting", requiredRoles: [{ role: "taster", min: 4, max: 12 }], venueType: "bar_lounge", hostRequired: false, minAttendees: 4 },
  { name: "pottery_workshop", displayName: "Pottery Workshop", requiredRoles: [{ role: "potter", min: 3, max: 8 }], venueType: "gallery", hostRequired: false, minAttendees: 3 },
  { name: "painting_session", displayName: "Painting Session", requiredRoles: [{ role: "painter", min: 3, max: 10 }], venueType: "gallery", hostRequired: false, minAttendees: 3 },
  { name: "yoga_session", displayName: "Yoga Session", requiredRoles: [{ role: "practitioner", min: 4, max: 15 }], venueType: "community_space", hostRequired: false, minAttendees: 4 },
  { name: "photo_walk", displayName: "Photo Walk", requiredRoles: [{ role: "photographer", min: 3, max: 12 }], venueType: "trailhead", hostRequired: false, minAttendees: 3 },
  { name: "hackathon", displayName: "Hackathon", requiredRoles: [{ role: "developer", min: 4, max: 20 }], venueType: "coworking_space", hostRequired: false, minAttendees: 4 },
  { name: "maker_workshop", displayName: "Maker Workshop", requiredRoles: [{ role: "maker", min: 2, max: 8 }], venueType: "makerspace", hostRequired: false, minAttendees: 2 },
  { name: "board_game_night", displayName: "Board Game Night", requiredRoles: [{ role: "player", min: 3, max: 8 }], venueType: "cafe", hostRequired: false, minAttendees: 3 },
  { name: "trivia_night", displayName: "Trivia Night", requiredRoles: [{ role: "player", min: 4, max: 6 }], venueType: "bar_lounge", hostRequired: false, minAttendees: 4 },
  { name: "writing_workshop", displayName: "Writing Workshop", requiredRoles: [{ role: "writer", min: 3, max: 8 }], venueType: "bookstore", hostRequired: false, minAttendees: 3 },
  { name: "classical_ensemble", displayName: "Classical Ensemble", requiredRoles: [{ role: "musician", min: 3, max: 6 }], venueType: "music_venue", hostRequired: false, minAttendees: 3 },
  { name: "dance_social", displayName: "Dance Social", requiredRoles: [{ role: "dancer", min: 6, max: 20 }], venueType: "dance_studio", hostRequired: false, minAttendees: 6 },
  { name: "pickup_volleyball", displayName: "Pickup Volleyball", requiredRoles: [{ role: "player", min: 6, max: 12 }], venueType: "outdoor_court", hostRequired: false, minAttendees: 6 },
  { name: "surf_session", displayName: "Surf Session", requiredRoles: [{ role: "surfer", min: 2, max: 6 }], venueType: "beach", hostRequired: false, minAttendees: 2 },
  { name: "skate_session", displayName: "Skate Session", requiredRoles: [{ role: "skater", min: 2, max: 8 }], venueType: "skatepark", hostRequired: false, minAttendees: 2 },
  { name: "startup_mixer", displayName: "Startup Mixer", requiredRoles: [{ role: "attendee", min: 8, max: 30 }], venueType: "coworking_space", hostRequired: false, minAttendees: 8 },
  { name: "garden_meetup", displayName: "Garden Meetup", requiredRoles: [{ role: "gardener", min: 3, max: 10 }], venueType: "community_garden", hostRequired: false, minAttendees: 3 },
  { name: "homebrew_club", displayName: "Homebrew Club", requiredRoles: [{ role: "brewer", min: 3, max: 8 }], venueType: "brewery", hostRequired: false, minAttendees: 3 },
  { name: "design_critique", displayName: "Design Critique", requiredRoles: [{ role: "designer", min: 3, max: 8 }], venueType: "coworking_space", hostRequired: false, minAttendees: 3 },
  { name: "drag_brunch", displayName: "Drag Brunch", requiredRoles: [{ role: "attendee", min: 6, max: 20 }], venueType: "restaurant", hostRequired: false, minAttendees: 6 },
];

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DAY = 24 * 60 * 60 * 1000;

function generateUser(usedNames: Set<string>) {
  let name: string;
  do {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  } while (usedNames.has(name));
  usedNames.add(name);

  // Pick 3-6 unique interests from weighted pool
  const numInterests = randInt(3, 6);
  const interests = new Set<string>();
  let attempts = 0;
  while (interests.size < numInterests && attempts < 50) {
    interests.add(pick(WEIGHTED_INTERESTS));
    attempts++;
  }

  return {
    name,
    age: randInt(21, 42),
    neighborhood: pick(NEIGHBORHOODS),
    interests: Array.from(interests),
  };
}

// ═══════════════════════════════════════════
// Main seed function — takes count parameter
// ═══════════════════════════════════════════

export const seedAll = internalMutation({
  args: { count: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userCount = args.count ?? 100;

    // Check if already seeded
    const allUsers = await ctx.db.query("users").collect();
    const seedMarker = allUsers.find((u) => u.bio === "__ppl_seed__");
    if (seedMarker) {
      console.log("Seed data already exists. To re-seed, delete the seed marker user first.");
      return;
    }

    // ── 1. Event types (skip existing) ──
    const existingEventTypes = await ctx.db.query("eventTypes").collect();
    const etNameMap = new Map(existingEventTypes.map((et) => [et.name, et._id]));
    for (const etDef of EVENT_TYPE_DEFS) {
      if (!etNameMap.has(etDef.name)) {
        const id = await ctx.db.insert("eventTypes", etDef);
        etNameMap.set(etDef.name, id);
      }
    }

    // ── 2. Venues ──
    const venueIdsByType = new Map<string, Id<"venues">>();
    for (const v of SEED_VENUES) {
      const id = await ctx.db.insert("venues", {
        mapboxId: `seed_${v.name.toLowerCase().replace(/\s+/g, "_")}`,
        name: v.name,
        address: v.address,
        venueType: v.venueType,
        isPrivateHome: v.isPrivateHome,
        lat: v.lat,
        lng: v.lng,
      });
      venueIdsByType.set(v.venueType, id);
    }

    // ── 3. Generate users ──
    const usedNames = new Set<string>();
    const usersByEtName = new Map<string, Id<"users">[]>();
    const seededUserIds: Id<"users">[] = [];

    // Insert a hidden seed marker so we can detect seed data
    await ctx.db.insert("users", {
      name: "__seed_marker__",
      bio: "__ppl_seed__",
      onboardingComplete: false,
    });

    const usedUsernames = new Set<string>();

    for (let i = 0; i < userCount; i++) {
      const u = generateUser(usedNames);

      // Simulate user joining over the past 3 months
      const joinedDaysAgo = randInt(1, 90);

      // Generate unique username from name
      const parts = u.name.toLowerCase().split(" ");
      let baseUsername = parts.join("_");
      let username = baseUsername;
      let suffix = 1;
      while (usedUsernames.has(username)) {
        username = `${baseUsername}${suffix}`;
        suffix++;
      }
      usedUsernames.add(username);

      const userId = await ctx.db.insert("users", {
        name: u.name,
        username,
        age: u.age,
        neighborhood: u.neighborhood,
        onboardingComplete: true,
      });
      seededUserIds.push(userId);

      // Insert interests
      const userEtNames = new Set<string>();
      for (const interest of u.interests) {
        await ctx.db.insert("interests", {
          userId,
          category: pick(["hobby", "hobby", "hobby", "learning", "skill"]) as "hobby" | "learning" | "skill",
          canonicalValue: interest,
          rawValue: interest,
          source: pick(["onboarding", "onboarding", "ideate"]) as "onboarding" | "ideate",
          isActive: true,
        });

        // Map to event type for gauging
        const etName = INTEREST_TO_EVENT_TYPE[interest];
        if (etName) {
          userEtNames.add(etName);
          if (!usersByEtName.has(etName)) usersByEtName.set(etName, []);
          usersByEtName.get(etName)!.push(userId);
        }
      }

      // Gauges for interest-matched event types (high yes rate)
      for (const etName of userEtNames) {
        const etId = etNameMap.get(etName);
        if (!etId) continue;
        // Gauge timestamp: random day between when they joined and now
        const gaugeDaysAgo = randInt(0, joinedDaysAgo);
        await ctx.db.insert("eventGauges", {
          userId,
          eventTypeId: etId,
          response: Math.random() < 0.75 ? "yes" : "no",
          timestamp: Date.now() - gaugeDaysAgo * DAY - randInt(0, DAY),
        });
      }

      // Extra random gauges (exploration — lower yes rate)
      const allEtNames = Array.from(etNameMap.keys());
      const extras = randInt(2, 6);
      for (let j = 0; j < extras; j++) {
        const randomEtName = pick(allEtNames);
        if (userEtNames.has(randomEtName)) continue;
        userEtNames.add(randomEtName); // prevent dupes
        const etId = etNameMap.get(randomEtName);
        if (!etId) continue;
        const gaugeDaysAgo = randInt(0, joinedDaysAgo);
        await ctx.db.insert("eventGauges", {
          userId,
          eventTypeId: etId,
          response: Math.random() < 0.35 ? "yes" : "no",
          timestamp: Date.now() - gaugeDaysAgo * DAY - randInt(0, DAY),
        });
      }
    }

    // ── 4. Generate events across the past 3 months + upcoming ──
    const EVENT_TEMPLATES = [
      { etName: "jazz_jam", reasons: ["jazz musicians in the Mission jammed all night", "SOMA + Hayes Valley pianists & drummers matched"] },
      { etName: "pickup_basketball", reasons: ["8 ballers ran a pickup game at SOMA Courts", "weekend hoops at Potrero Hill Rec Center"] },
      { etName: "group_hike", reasons: ["hikers explored Lands End trail together", "sunrise hike at Crissy Field"] },
      { etName: "running_club", reasons: ["6 runners did the Embarcadero loop", "morning run through Golden Gate Park"] },
      { etName: "climbing_session", reasons: ["climbers bouldered at Mission Cliffs", "climbing session at the gym"] },
      { etName: "dinner_party", reasons: ["host + 5 foodies made pasta from scratch", "Thai cooking night in Pacific Heights"] },
      { etName: "book_club", reasons: ["readers discussed Klara and the Sun at Café Réveille", "book club met at City Lights"] },
      { etName: "wine_tasting", reasons: ["6 wine lovers tasted at The Interval", "natural wine tasting in Hayes Valley"] },
      { etName: "hackathon", reasons: ["12 devs built projects at Galvanize SOMA", "weekend hack at Spark Social"] },
      { etName: "yoga_session", reasons: ["yogis flowed at The Bindery", "sunset yoga at Dolores Park"] },
      { etName: "photo_walk", reasons: ["photographers explored North Beach", "golden hour photo walk at Crissy Field"] },
      { etName: "board_game_night", reasons: ["board game night at Café Réveille", "game night in the Mission"] },
      { etName: "trivia_night", reasons: ["trivia night at The Interval", "pub quiz at NEMA Rooftop"] },
      { etName: "dance_social", reasons: ["salsa night at The Midway", "dance social in the Mission"] },
      { etName: "surf_session", reasons: ["surfers caught waves at Ocean Beach", "dawn patrol at OB"] },
      { etName: "maker_workshop", reasons: ["makers 3D printed at Noisebridge", "workshop at the makerspace"] },
      { etName: "classical_ensemble", reasons: ["string quartet rehearsed at SF Community Music Center"] },
      { etName: "pottery_workshop", reasons: ["pottery session at Hayes Valley Art Works"] },
    ];

    // Track attendees per completed event for connections/friends
    const completedEventAttendees: { eventId: Id<"events">; attendees: Id<"users">[]; daysAgo: number }[] = [];

    // Past completed events (spread over 3 months)
    for (let i = 0; i < 8; i++) {
      const tmpl = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length];
      const etId = etNameMap.get(tmpl.etName);
      if (!etId) continue;
      const etDef = EVENT_TYPE_DEFS.find((e) => e.name === tmpl.etName);
      const venueId = etDef ? venueIdsByType.get(etDef.venueType) : undefined;
      const daysAgo = randInt(7, 85);

      const eventId = await ctx.db.insert("events", {
        eventTypeId: etId,
        status: "completed",
        venueId,
        scheduledTime: Date.now() - daysAgo * DAY,
        matchReason: pick(tmpl.reasons),
        rsvpDeadline: Date.now() - (daysAgo + 1) * DAY,
      });

      // RSVPs from interested users
      const interested = usersByEtName.get(tmpl.etName) ?? [];
      const rsvpCount = randInt(3, Math.min(8, interested.length));
      const shuffled = [...interested].sort(() => Math.random() - 0.5);
      const eventAttendees: Id<"users">[] = [];
      for (const uid of shuffled.slice(0, rsvpCount)) {
        const went = Math.random() < 0.85;
        await ctx.db.insert("rsvps", {
          userId: uid,
          eventId,
          response: went ? "can_go" : "unavailable",
          timestamp: Date.now() - (daysAgo + 2) * DAY,
        });
        if (went) eventAttendees.push(uid);
      }
      completedEventAttendees.push({ eventId, attendees: eventAttendees, daysAgo });
    }

    // Upcoming pending_rsvp events
    for (let i = 0; i < 4; i++) {
      const tmpl = EVENT_TEMPLATES[(i + 8) % EVENT_TEMPLATES.length];
      const etId = etNameMap.get(tmpl.etName);
      if (!etId) continue;
      const etDef = EVENT_TYPE_DEFS.find((e) => e.name === tmpl.etName);
      const venueId = etDef ? venueIdsByType.get(etDef.venueType) : undefined;
      const daysUntil = randInt(2, 8);

      await ctx.db.insert("events", {
        eventTypeId: etId,
        status: "pending_rsvp",
        venueId,
        scheduledTime: Date.now() + daysUntil * DAY,
        matchReason: pick(tmpl.reasons),
        rsvpDeadline: Date.now() + (daysUntil - 1) * DAY,
      });
    }

    // Upcoming confirmed events
    for (let i = 0; i < 4; i++) {
      const tmpl = EVENT_TEMPLATES[(i + 12) % EVENT_TEMPLATES.length];
      const etId = etNameMap.get(tmpl.etName);
      if (!etId) continue;
      const etDef = EVENT_TYPE_DEFS.find((e) => e.name === tmpl.etName);
      const venueId = etDef ? venueIdsByType.get(etDef.venueType) : undefined;
      const daysUntil = randInt(1, 5);

      const eventId = await ctx.db.insert("events", {
        eventTypeId: etId,
        status: "confirmed",
        venueId,
        scheduledTime: Date.now() + daysUntil * DAY,
        matchReason: pick(tmpl.reasons),
        rsvpDeadline: Date.now() + (daysUntil - 1) * DAY,
      });

      // Confirmed events have RSVPs already
      const interested = usersByEtName.get(tmpl.etName) ?? [];
      const rsvpCount = randInt(3, Math.min(6, interested.length));
      const shuffled = [...interested].sort(() => Math.random() - 0.5);
      for (const uid of shuffled.slice(0, rsvpCount)) {
        await ctx.db.insert("rsvps", {
          userId: uid,
          eventId,
          response: "can_go",
          timestamp: Date.now() - randInt(1, 3) * DAY,
        });
      }
    }

    // ── 5. Connections — every pair of co-attendees at completed events ──
    let connectionCount = 0;
    const connectionPairs = new Set<string>(); // "uid1:uid2" dedup

    for (const { eventId, attendees, daysAgo } of completedEventAttendees) {
      for (let a = 0; a < attendees.length; a++) {
        for (let b = a + 1; b < attendees.length; b++) {
          const pairKey = [attendees[a], attendees[b]].sort().join(":");
          if (connectionPairs.has(pairKey)) continue; // only unique pairs across all events
          connectionPairs.add(pairKey);

          // Bidirectional connection
          await ctx.db.insert("connections", {
            userId: attendees[a],
            connectedUserId: attendees[b],
            eventId,
            createdAt: Date.now() - daysAgo * DAY,
          });
          await ctx.db.insert("connections", {
            userId: attendees[b],
            connectedUserId: attendees[a],
            eventId,
            createdAt: Date.now() - daysAgo * DAY,
          });
          connectionCount++;
        }
      }
    }

    // ── 6. Friends — ~40% of connections become accepted friends, some pending ──
    let friendCount = 0;
    const friendPairs = new Set<string>();

    for (const pairKey of connectionPairs) {
      if (Math.random() > 0.4) continue; // 40% chance to be friends
      const [uid1, uid2] = pairKey.split(":") as [string, string];
      if (friendPairs.has(pairKey)) continue;
      friendPairs.add(pairKey);

      const isAccepted = Math.random() < 0.8; // 80% accepted, 20% pending
      await ctx.db.insert("friends", {
        requesterId: uid1 as Id<"users">,
        receiverId: uid2 as Id<"users">,
        status: isAccepted ? "accepted" : "pending",
        createdAt: Date.now() - randInt(1, 60) * DAY,
      });
      friendCount++;
    }

    // Also add some random friends between users in the same neighborhood
    const usersByHood = new Map<string, Id<"users">[]>();
    for (let i = 0; i < seededUserIds.length && i < userCount; i++) {
      const hood = NEIGHBORHOODS[i % NEIGHBORHOODS.length]; // approximate
      if (!usersByHood.has(hood)) usersByHood.set(hood, []);
      usersByHood.get(hood)!.push(seededUserIds[i]);
    }
    for (const [, hoodUsers] of usersByHood) {
      const friendsToMake = Math.min(3, Math.floor(hoodUsers.length / 2));
      for (let i = 0; i < friendsToMake; i++) {
        const a = pick(hoodUsers);
        const b = pick(hoodUsers);
        if (a === b) continue;
        const pairKey = [a, b].sort().join(":");
        if (friendPairs.has(pairKey)) continue;
        friendPairs.add(pairKey);
        await ctx.db.insert("friends", {
          requesterId: a,
          receiverId: b,
          status: "accepted",
          createdAt: Date.now() - randInt(5, 75) * DAY,
        });
        friendCount++;
      }
    }

    // ── 7. Post-event reactions (people who vibed at completed events) ──
    let reactionCount = 0;
    for (const { eventId, attendees, daysAgo } of completedEventAttendees) {
      // Each attendee reacts to ~50% of other attendees
      for (const userId of attendees) {
        for (const other of attendees) {
          if (userId === other) continue;
          if (Math.random() > 0.5) continue;
          await ctx.db.insert("postEventReactions", {
            userId,
            reactedToUserId: other,
            eventId,
            createdAt: Date.now() - (daysAgo - 1) * DAY,
          });
          reactionCount++;
        }
      }
    }

    console.log(`Seeded ${userCount} users, ${SEED_VENUES.length} venues, ${EVENT_TYPE_DEFS.length} event types, 16 events, ${connectionCount} connections, ${friendCount} friends, ${reactionCount} reactions.`);
  },
});

// ═══════════════════════════════════════════
// Backfill — add interests to existing seed users
// Run this if seed already exists but interests are missing
// ═══════════════════════════════════════════

const BACKFILL_INTERESTS = [
  "pop culture", "politics", "thai food", "homelessness",
  "homelessness solutions", "new friends", "eating chicken wing competition",
];

export const backfillInterests = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all seed users (onboardingComplete, not the marker)
    const allUsers = await ctx.db.query("users").collect();
    const seedUsers = allUsers.filter(
      (u) => u.onboardingComplete && u.bio !== "__ppl_seed__" && u.name !== "__seed_marker__"
    );
    if (seedUsers.length === 0) {
      console.log("No seed users found. Run seedAll first.");
      return;
    }

    let added = 0;
    for (const interest of BACKFILL_INTERESTS) {
      // Check how many seed users already have this interest
      const existing = await ctx.db
        .query("interests")
        .withIndex("by_canonicalValue", (q) => q.eq("canonicalValue", interest))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      const existingUserIds = new Set(existing.map((i) => i.userId.toString()));

      // Assign to 8-25 random seed users who don't already have it
      const eligible = seedUsers.filter((u) => !existingUserIds.has(u._id.toString()));
      const count = Math.min(randInt(8, 25), eligible.length);
      const shuffled = [...eligible].sort(() => Math.random() - 0.5);

      for (const user of shuffled.slice(0, count)) {
        await ctx.db.insert("interests", {
          userId: user._id,
          category: pick(["hobby", "hobby", "problem", "learning", "skill"]) as "hobby" | "problem" | "learning" | "skill",
          canonicalValue: interest,
          rawValue: interest,
          source: "onboarding",
          isActive: true,
        });
        added++;
      }
    }

    console.log(`Backfilled ${added} interest records across ${BACKFILL_INTERESTS.length} interests.`);
  },
});

// ═══════════════════════════════════════════
// Seed data for a specific real user
// Creates: events attended, friends, connections
// ═══════════════════════════════════════════

export const seedForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Get seed users to use as co-attendees / friends
    const allUsers = await ctx.db.query("users").collect();
    const seedUsers = allUsers.filter(
      (u) =>
        u._id !== userId &&
        u.onboardingComplete &&
        u.name !== "__seed_marker__" &&
        u.bio !== "__ppl_seed__"
    );
    if (seedUsers.length === 0) throw new Error("No seed users. Run seedAll first.");

    const shuffled = [...seedUsers].sort(() => Math.random() - 0.5);

    // ── 1. Events attended — RSVP this user into existing completed events ──
    const completedEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    // Pick 3-5 completed events
    const eventsToAttend = completedEvents
      .sort(() => Math.random() - 0.5)
      .slice(0, randInt(3, Math.min(5, completedEvents.length)));

    const coAttendees: Id<"users">[] = []; // people user "met" at events

    for (const event of eventsToAttend) {
      // Check if already has RSVP
      const existingRsvp = await ctx.db
        .query("rsvps")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (!existingRsvp) {
        await ctx.db.insert("rsvps", {
          userId,
          eventId: event._id,
          response: "can_go",
          timestamp: (event.scheduledTime ?? Date.now()) - 2 * DAY,
        });
      }

      // Find other attendees of this event
      const eventRsvps = await ctx.db
        .query("rsvps")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("response"), "can_go"),
            q.neq(q.field("userId"), userId)
          )
        )
        .collect();

      for (const rsvp of eventRsvps) {
        coAttendees.push(rsvp.userId);
      }
    }

    // ── 2. Connections — bidirectional with co-attendees ──
    const existingConnections = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const existingConnectedIds = new Set(
      existingConnections.map((c) => c.connectedUserId.toString())
    );

    let connectionCount = 0;
    const connectedIds = new Set<string>();

    // Connections from co-attended events
    for (const event of eventsToAttend) {
      const eventRsvps = await ctx.db
        .query("rsvps")
        .withIndex("by_eventId", (q) => q.eq("eventId", event._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("response"), "can_go"),
            q.neq(q.field("userId"), userId)
          )
        )
        .collect();

      for (const rsvp of eventRsvps) {
        const otherId = rsvp.userId;
        if (existingConnectedIds.has(otherId.toString())) continue;
        if (connectedIds.has(otherId.toString())) continue;
        connectedIds.add(otherId.toString());

        await ctx.db.insert("connections", {
          userId,
          connectedUserId: otherId,
          eventId: event._id,
          createdAt: event.scheduledTime ?? Date.now(),
        });
        await ctx.db.insert("connections", {
          userId: otherId,
          connectedUserId: userId,
          eventId: event._id,
          createdAt: event.scheduledTime ?? Date.now(),
        });
        connectionCount++;
      }
    }

    // Also add a few extra connections from random seed users (people from earlier events)
    const extraConnections = shuffled
      .filter((u) => !connectedIds.has(u._id.toString()) && !existingConnectedIds.has(u._id.toString()))
      .slice(0, randInt(3, 6));

    // Need a completed event to reference
    const refEvent = eventsToAttend[0] ?? completedEvents[0];
    if (refEvent) {
      for (const other of extraConnections) {
        connectedIds.add(other._id.toString());
        await ctx.db.insert("connections", {
          userId,
          connectedUserId: other._id,
          eventId: refEvent._id,
          createdAt: Date.now() - randInt(10, 60) * DAY,
        });
        await ctx.db.insert("connections", {
          userId: other._id,
          connectedUserId: userId,
          eventId: refEvent._id,
          createdAt: Date.now() - randInt(10, 60) * DAY,
        });
        connectionCount++;
      }
    }

    // ── 3. Friends — make some connections into friends ──
    const allConnectedIds = [...connectedIds];
    const friendCount = Math.min(randInt(4, 8), allConnectedIds.length);
    const friendCandidates = allConnectedIds
      .sort(() => Math.random() - 0.5)
      .slice(0, friendCount);

    let friendsMade = 0;
    for (const friendIdStr of friendCandidates) {
      const friendId = friendIdStr as Id<"users">;

      // Check existing friendship in either direction
      const existing1 = await ctx.db
        .query("friends")
        .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
        .filter((q) => q.eq(q.field("receiverId"), friendId))
        .first();
      const existing2 = await ctx.db
        .query("friends")
        .withIndex("by_requesterId", (q) => q.eq("requesterId", friendId))
        .filter((q) => q.eq(q.field("receiverId"), userId))
        .first();

      if (existing1 || existing2) continue;

      // Single coin flip — requester and receiver are always different people
      const userIsRequester = Math.random() < 0.5;
      await ctx.db.insert("friends", {
        requesterId: userIsRequester ? userId : friendId,
        receiverId: userIsRequester ? friendId : userId,
        status: "accepted",
        createdAt: Date.now() - randInt(1, 45) * DAY,
      });
      friendsMade++;
    }

    // Add 1-2 pending incoming friend requests for flavor
    const pendingCandidates = shuffled
      .filter((u) => !connectedIds.has(u._id.toString()))
      .slice(0, randInt(1, 2));
    for (const requester of pendingCandidates) {
      const exists = await ctx.db
        .query("friends")
        .withIndex("by_requesterId", (q) => q.eq("requesterId", requester._id))
        .filter((q) => q.eq(q.field("receiverId"), userId))
        .first();
      if (exists) continue;

      await ctx.db.insert("friends", {
        requesterId: requester._id,
        receiverId: userId,
        status: "pending",
        createdAt: Date.now() - randInt(0, 3) * DAY,
      });
    }

    console.log(
      `Seeded for user ${user.name ?? userId}: ${eventsToAttend.length} events attended, ${connectionCount} connections, ${friendsMade} friends, ${pendingCandidates.length} pending requests`
    );
  },
});

// ═══════════════════════════════════════════
// Cleanup bad seed data for a user
// Removes self-friends, duplicate friends, duplicate connections
// ═══════════════════════════════════════════

export const cleanupUserSeedData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    let deleted = 0;

    // Delete self-referential friends (requesterId === receiverId)
    const allFriends = await ctx.db.query("friends").collect();
    for (const f of allFriends) {
      if (f.requesterId === f.receiverId) {
        await ctx.db.delete(f._id);
        deleted++;
      }
    }

    // Deduplicate friends involving this user
    const userFriendsAsReq = await ctx.db
      .query("friends")
      .withIndex("by_requesterId", (q) => q.eq("requesterId", userId))
      .collect();
    const userFriendsAsRec = await ctx.db
      .query("friends")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .collect();

    const seenPairs = new Set<string>();
    for (const f of [...userFriendsAsReq, ...userFriendsAsRec]) {
      const pairKey = [f.requesterId, f.receiverId].sort().join(":");
      if (seenPairs.has(pairKey)) {
        await ctx.db.delete(f._id);
        deleted++;
      } else {
        seenPairs.add(pairKey);
      }
    }

    // Deduplicate connections for this user
    const userConns = await ctx.db
      .query("connections")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    const seenConnections = new Set<string>();
    for (const c of userConns) {
      const key = c.connectedUserId.toString();
      if (seenConnections.has(key)) {
        await ctx.db.delete(c._id);
        deleted++;
      } else {
        seenConnections.add(key);
      }
    }

    console.log(`Cleaned up ${deleted} bad/duplicate records for user ${userId}`);
  },
});
