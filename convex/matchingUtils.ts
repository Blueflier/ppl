// Shared interest-to-eventType mapping and venue suggestions
// Used by ideateAction.ts (traces) and matchAndCreateEvents.ts (event creation)

export const INTEREST_MAP: Record<string, string> = {
  "jazz piano": "jazz_jam",
  "jazz drums": "jazz_jam",
  jazz: "jazz_jam",
  "music production": "jazz_jam",
  basketball: "pickup_basketball",
  hiking: "group_hike",
  running: "running_club",
  "rock climbing": "climbing_session",
  climbing: "climbing_session",
  "dinner party": "dinner_party",
  cooking: "dinner_party",
  "book club": "book_club",
  reading: "book_club",
  "wine tasting": "wine_tasting",
  wine: "wine_tasting",
  pottery: "pottery_workshop",
  ceramics: "pottery_workshop",
  painting: "painting_session",
  art: "painting_session",
  yoga: "yoga_session",
  meditation: "yoga_session",
  photography: "photo_walk",
  hackathon: "hackathon",
  coding: "hackathon",
  programming: "hackathon",
  "machine learning": "hackathon",
  "3d printing": "maker_workshop",
  woodworking: "maker_workshop",
  making: "maker_workshop",
  "board games": "board_game_night",
  "video games": "board_game_night",
  gaming: "board_game_night",
  trivia: "trivia_night",
  writing: "writing_workshop",
  "creative writing": "writing_workshop",
  "classical music": "classical_ensemble",
  violin: "classical_ensemble",
  cello: "classical_ensemble",
  salsa: "dance_social",
  dancing: "dance_social",
  volleyball: "pickup_volleyball",
  surfing: "surf_session",
  skateboarding: "skate_session",
  startup: "startup_mixer",
  networking: "startup_mixer",
  gardening: "garden_meetup",
  brewing: "homebrew_club",
  design: "design_critique",
  // Broad onboarding categories
  tech: "hackathon",
  business: "startup_mixer",
  sports: "pickup_basketball",
  science: "hackathon",
  "pop culture": "trivia_night",
  philosophy: "book_club",
};

export const VENUE_SUGGESTIONS: Record<
  string,
  { desc: string; lat: number; lng: number; name: string; address: string }
> = {
  music_studio: { desc: "indoor acoustic spot in the Mission", lat: 37.7525, lng: -122.4147, name: "The Jam Spot", address: "3030 20th St, San Francisco, CA" },
  outdoor_court: { desc: "outdoor court at Potrero Hill", lat: 37.7573, lng: -122.3985, name: "Potrero Hill Rec Center", address: "801 Arkansas St, San Francisco, CA" },
  trailhead: { desc: "trailhead near Lands End", lat: 37.7879, lng: -122.5053, name: "Lands End Trail", address: "680 Point Lobos Ave, San Francisco, CA" },
  outdoor_park: { desc: "Dolores Park meetup spot", lat: 37.7596, lng: -122.4269, name: "Dolores Park", address: "19th & Dolores St, San Francisco, CA" },
  climbing_gym: { desc: "climbing gym in the Mission", lat: 37.7603, lng: -122.413, name: "Mission Cliffs", address: "2295 Harrison St, San Francisco, CA" },
  private_home: { desc: "cozy home kitchen in Hayes Valley", lat: 37.7764, lng: -122.4244, name: "Hayes Valley Home", address: "Hayes Valley, San Francisco, CA" },
  cafe: { desc: "quiet cafe in North Beach", lat: 37.7976, lng: -122.4065, name: "City Lights Books area", address: "261 Columbus Ave, San Francisco, CA" },
  bar_lounge: { desc: "lounge at Fort Mason", lat: 37.8066, lng: -122.4316, name: "The Interval", address: "2 Marina Blvd, San Francisco, CA" },
  art_studio: { desc: "art studio in Hayes Valley", lat: 37.7764, lng: -122.4244, name: "Hayes Valley Art Gallery", address: "432 Octavia St, San Francisco, CA" },
  gallery: { desc: "gallery space in Hayes Valley", lat: 37.7764, lng: -122.4244, name: "Hayes Valley Art Gallery", address: "432 Octavia St, San Francisco, CA" },
  studio: { desc: "yoga studio in the Mission", lat: 37.7627, lng: -122.4189, name: "Mission Yoga", address: "2390 Mission St, San Francisco, CA" },
  outdoor_neighborhood: { desc: "scenic streets of North Beach", lat: 37.7976, lng: -122.4065, name: "North Beach", address: "North Beach, San Francisco, CA" },
  coworking_space: { desc: "coworking space in SOMA", lat: 37.7713, lng: -122.3909, name: "Spark Social SF", address: "601 Mission Bay Blvd, San Francisco, CA" },
  makerspace: { desc: "makerspace in the Mission", lat: 37.7627, lng: -122.4189, name: "Noisebridge", address: "2169 Mission St, San Francisco, CA" },
  bookstore: { desc: "bookstore in North Beach", lat: 37.7976, lng: -122.4065, name: "City Lights Books", address: "261 Columbus Ave, San Francisco, CA" },
  music_venue: { desc: "community music center in the Mission", lat: 37.7584, lng: -122.418, name: "SF Community Music Center", address: "544 Capp St, San Francisco, CA" },
  dance_studio: { desc: "dance studio in the Mission", lat: 37.7584, lng: -122.418, name: "Mission Dance Studio", address: "3316 24th St, San Francisco, CA" },
  beach: { desc: "Ocean Beach at sunset", lat: 37.7594, lng: -122.5107, name: "Ocean Beach", address: "Great Hwy, San Francisco, CA" },
  skatepark: { desc: "skatepark under the freeway", lat: 37.7756, lng: -122.4141, name: "SoMa Skatepark", address: "520 De Haro St, San Francisco, CA" },
  community_garden: { desc: "community garden in the Sunset", lat: 37.7604, lng: -122.4936, name: "Sunset Community Garden", address: "Sunset Blvd, San Francisco, CA" },
  food_hall: { desc: "food hall in Mission Bay", lat: 37.7713, lng: -122.3909, name: "Spark Social SF", address: "601 Mission Bay Blvd, San Francisco, CA" },
  restaurant: { desc: "restaurant in the Castro", lat: 37.7609, lng: -122.435, name: "Castro Restaurant", address: "Castro St, San Francisco, CA" },
  rooftop_lounge: { desc: "rooftop lounge in SOMA", lat: 37.7756, lng: -122.4141, name: "NEMA Rooftop", address: "8 10th St, San Francisco, CA" },
  rec_center: { desc: "rec center on Potrero Hill", lat: 37.7573, lng: -122.3985, name: "Potrero Hill Rec Center", address: "801 Arkansas St, San Francisco, CA" },
  community_kitchen: { desc: "community kitchen in SOMA", lat: 37.7708, lng: -122.4151, name: "Rainbow Grocery area", address: "1745 Folsom St, San Francisco, CA" },
  community_space: { desc: "community space in the Haight", lat: 37.7692, lng: -122.4518, name: "The Bindery", address: "1727 Haight St, San Francisco, CA" },
  outdoor_field: { desc: "Golden Gate Park fields", lat: 37.7694, lng: -122.4936, name: "GGP Polo Fields", address: "Golden Gate Park, San Francisco, CA" },
};

// Fuzzy match a canonical interest value to an event type name
export function matchInterestToEventType(
  canonicalValue: string,
  eventTypeGauges: Record<
    string,
    {
      eventTypeId: string;
      displayName: string;
      yesCount: number;
      noCount: number;
    }
  >
): {
  etName: string;
  data: {
    eventTypeId: string;
    displayName: string;
    yesCount: number;
    noCount: number;
  };
} | null {
  const cv = canonicalValue.toLowerCase();

  // Try direct mapping first
  const directMatch = INTEREST_MAP[cv];
  if (directMatch && eventTypeGauges[directMatch]) {
    return { etName: directMatch, data: eventTypeGauges[directMatch] };
  }

  // Fuzzy: check if canonicalValue is a substring of event type name or vice versa
  for (const [etName, data] of Object.entries(eventTypeGauges)) {
    const etReadable = etName.replace(/_/g, " ");
    if (etReadable.includes(cv) || cv.includes(etReadable)) {
      return { etName, data };
    }
  }

  return null;
}
