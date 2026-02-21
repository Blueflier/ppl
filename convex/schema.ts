import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    age: v.optional(v.number()),
    bio: v.optional(v.string()),
    neighborhood: v.optional(v.string()),
    onboardingComplete: v.optional(v.boolean()),
    calendarConnected: v.optional(v.boolean()),
    calendarRefreshToken: v.optional(v.string()),
    manualAvailability: v.optional(v.array(v.string())),
    profileImageId: v.optional(v.id("_storage")),
    username: v.optional(v.string()),
    hostingWillingness: v.optional(
      v.union(v.literal("willing"), v.literal("not_willing"), v.literal("depends"))
    ),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  interests: defineTable({
    userId: v.id("users"),
    category: v.union(
      v.literal("hobby"),
      v.literal("problem"),
      v.literal("learning"),
      v.literal("skill")
    ),
    canonicalValue: v.string(),
    rawValue: v.string(),
    source: v.union(
      v.literal("onboarding"),
      v.literal("ideate"),
      v.literal("inferred")
    ),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_canonicalValue", ["canonicalValue"]),

  vocab: defineTable({
    term: v.string(),
    category: v.string(),
    isUserGenerated: v.boolean(),
    inferredMeaning: v.string(),
  }).index("by_term", ["term"]),

  eventTypes: defineTable({
    name: v.string(),
    displayName: v.string(),
    requiredRoles: v.array(
      v.object({
        role: v.string(),
        min: v.number(),
        max: v.optional(v.number()),
        skills: v.optional(v.array(v.string())),
      })
    ),
    venueType: v.string(),
    hostRequired: v.boolean(),
    minAttendees: v.number(),
    eventSchema: v.optional(v.any()),
    imageStorageId: v.optional(v.id("_storage")),
  }).index("by_name", ["name"]),

  events: defineTable({
    eventTypeId: v.id("eventTypes"),
    status: v.union(
      v.literal("gauging"),
      v.literal("pending_rsvp"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed")
    ),
    venueId: v.optional(v.id("venues")),
    scheduledTime: v.optional(v.number()),
    matchReason: v.string(),
    hostUserId: v.optional(v.id("users")),
    rsvpDeadline: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_eventTypeId", ["eventTypeId"]),

  eventGauges: defineTable({
    userId: v.id("users"),
    eventTypeId: v.id("eventTypes"),
    response: v.union(v.literal("yes"), v.literal("no")),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventTypeId", ["eventTypeId"])
    .index("by_userId_eventTypeId", ["userId", "eventTypeId"]),

  rsvps: defineTable({
    userId: v.id("users"),
    eventId: v.id("events"),
    response: v.union(v.literal("can_go"), v.literal("unavailable")),
    stillWantsToGo: v.optional(v.boolean()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_eventId", ["eventId"]),

  venues: defineTable({
    mapboxId: v.optional(v.string()),
    name: v.string(),
    address: v.string(),
    venueType: v.string(),
    isPrivateHome: v.boolean(),
    hostUserId: v.optional(v.id("users")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  }),

  friends: defineTable({
    requesterId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    createdAt: v.number(),
  })
    .index("by_requesterId", ["requesterId"])
    .index("by_receiverId", ["receiverId"]),

  connections: defineTable({
    userId: v.id("users"),
    connectedUserId: v.id("users"),
    eventId: v.id("events"),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  ideateLogs: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    extractedInterests: v.optional(v.array(v.string())),
    timestamp: v.number(),
  }).index("by_userId_sessionId", ["userId", "sessionId"]),

  postEventReactions: defineTable({
    userId: v.id("users"),
    reactedToUserId: v.id("users"),
    eventId: v.id("events"),
    createdAt: v.number(),
  }).index("by_eventId", ["eventId"]),

  ideateTraces: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    traceType: v.union(
      v.literal("searching_people"),
      v.literal("found_match"),
      v.literal("pinging_user"),
      v.literal("searching_venue"),
      v.literal("found_venue"),
      v.literal("summary")
    ),
    content: v.string(),
    metadata: v.optional(
      v.object({
        matchedCount: v.optional(v.number()),
        eventTypeName: v.optional(v.string()),
        venueName: v.optional(v.string()),
        venueLocation: v.optional(
          v.object({ lat: v.number(), lng: v.number() })
        ),
      })
    ),
    timestamp: v.number(),
  }).index("by_userId_sessionId", ["userId", "sessionId"]),
});
