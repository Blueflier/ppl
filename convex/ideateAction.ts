"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import {
  INTEREST_MAP,
  VENUE_SUGGESTIONS,
  matchInterestToEventType,
} from "./matchingUtils";

const SESSION_ID = "main";

const VENUE_TYPE_LIST = Object.keys(VENUE_SUGGESTIONS).join(", ");

const SYSTEM_PROMPT = `You're a chill concierge connecting people in SF. Ultra casual, brief.

CORE RULE: Extract interests fast. Don't interrogate.
- Clear interest ("i like basketball") → extract immediately
- Ambiguous ("i like jazz") → ONE follow-up max: "Listening or playing?" → then extract
- NEVER ask about: skill level, experience, equipment, logistics, hosting
- After extracting, always nudge for the next interest

Follow-up triggers (ONLY these warrant a question):
- Activity could mean very different event types (jazz listening vs jazz playing)
- Group size matters for the event format (pickup basketball vs 3v3)
- That's it. Everything else, just extract and move on.

When you understand a clear interest, quietly extract it AND suggest an event for it (never mention the JSON to the user):
\`\`\`interests
[{"category":"hobby","canonicalValue":"jazz piano","rawValue":"playing jazz piano"}]
\`\`\`
Categories: hobby, problem, learning, skill. Only extract when specific enough. canonicalValue=short lowercase. Skip already-known interests.

For EVERY interest you extract, also emit an event suggestion:
\`\`\`eventSuggestion
{"interest":"jazz piano","eventName":"Jazz Jam Session","venueType":"music_studio","description":"Get together with other jazz nerds to jam, trade licks, and vibe out."}
\`\`\`
venueType must be one of: ${VENUE_TYPE_LIST}
Be creative with eventName — make it sound fun and social. Pick the most fitting venueType. Include a \`description\`: fun 1-2 sentence description of what the event is about. Conversational, explain the vibe.

IMPORTANT — your visible response style:
- For common interests (basketball, hiking, cooking): "Nice, got it! I'll see who else in SF is down. What else?"
- For unique/niche interests (unicycle, fermentation, lockpicking): acknowledge it's cool and mention you're putting it out to gauge interest. Examples:
  - "Unicycle? That's awesome — I'll put that out and see who else in SF is down! What else?"
  - "Fermentation is so niche, love it. I'll gauge interest for a meetup. Anything else?"
- For compound/niche combos ("rock climbing while eating bananas"):
  Split into parts. Recognize what exists ("climbing — on it!") and get hyped about the novel part ("bananas + climbing? that's WILD, making that its own event!").
  Emit SEPARATE interests + eventSuggestion blocks for each part.
- Keep it 1-2 sentences max. Always end by asking what else they're into.
- NEVER mention venue names, times, or logistics — that gets figured out later once enough people are interested.

When the conversation gets specific enough that someone mentions concrete activities (like hosting dinners, having space, organizing meetups), naturally ask if they'd be open to hosting something. Based on their answer, extract:
\`\`\`hosting
{"willingness":"willing"}
\`\`\`
willingness values: "willing", "not_willing", "depends". Only extract once per conversation. Don't force it — only ask when it flows naturally.`;

function buildMessages(
  history: { role: "user" | "assistant"; content: string }[],
  existingInterests: string[]
) {
  const systemAddendum =
    existingInterests.length > 0
      ? `\n\nUser's existing interests (don't re-extract these): ${existingInterests.join(", ")}`
      : "";

  const messages = history.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return { system: SYSTEM_PROMPT + systemAddendum, messages };
}

function parseResponse(text: string): {
  displayText: string;
  interests: {
    category: "hobby" | "problem" | "learning" | "skill";
    canonicalValue: string;
    rawValue: string;
  }[];
  eventSuggestions: {
    interest: string;
    eventName: string;
    venueType: string;
    description?: string;
  }[];
  hosting: { willingness: "willing" | "not_willing" | "depends" } | null;
} {
  const interestBlocks: {
    category: "hobby" | "problem" | "learning" | "skill";
    canonicalValue: string;
    rawValue: string;
  }[] = [];
  const eventSuggestions: {
    interest: string;
    eventName: string;
    venueType: string;
    description?: string;
  }[] = [];
  let hosting: { willingness: "willing" | "not_willing" | "depends" } | null =
    null;

  const displayText = text
    .replace(/```interests\s*([\s\S]*?)```/g, (_match, jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr.trim());
        if (Array.isArray(parsed)) {
          interestBlocks.push(...parsed);
        }
      } catch {
        // ignore malformed JSON
      }
      return "";
    })
    .replace(
      /```eventSuggestion\s*([\s\S]*?)```/g,
      (_match, jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr.trim());
          if (parsed && parsed.interest && parsed.eventName && parsed.venueType) {
            eventSuggestions.push(parsed);
          }
        } catch {
          // ignore malformed JSON
        }
        return "";
      }
    )
    .replace(/```hosting\s*([\s\S]*?)```/g, (_match, jsonStr: string) => {
      try {
        const parsed = JSON.parse(jsonStr.trim());
        if (parsed && parsed.willingness) {
          hosting = parsed;
        }
      } catch {
        // ignore malformed JSON
      }
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { displayText, interests: interestBlocks, eventSuggestions, hosting };
}

export const sendMessage = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const user = await ctx.runQuery(api.users.getUser);
    if (!user) throw new Error("Not authenticated");

    const [existingInterests, chatHistory] = await Promise.all([
      ctx.runQuery(api.interests.getUserInterests),
      ctx.runQuery(api.ideate.getChatHistory),
    ]);

    // Save user message
    await ctx.runMutation(internal.ideate.saveIdeateLog, {
      userId: user._id,
      sessionId: SESSION_ID,
      role: "user",
      content: message,
      timestamp: Date.now(),
    });

    // Build conversation for Claude
    const allMessages = [
      ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: message },
    ];
    const existingCanonicals = existingInterests.map((i) => i.canonicalValue);
    const { system, messages } = buildMessages(allMessages, existingCanonicals);

    // Call Claude
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system,
      messages,
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const { displayText, interests, eventSuggestions, hosting } =
      parseResponse(rawText);

    // Save extracted interests
    if (interests.length > 0) {
      await ctx.runMutation(internal.ideate.saveIdeateInterests, {
        userId: user._id,
        interests,
      });
    }

    // Save hosting willingness
    if (hosting) {
      await ctx.runMutation(internal.users.updateHostingWillingness, {
        userId: user._id,
        hostingWillingness: hosting.willingness,
      });
    }

    // ── Process extracted interests: gauge, create event types, check thresholds ──
    if (interests.length > 0) {
      // Clear old traces before writing new batch
      await ctx.runMutation(internal.ideate.clearTraces, {
        userId: user._id,
        sessionId: SESSION_ID,
      });

      // Fetch real gauge data for existing event types
      const eventTypeGauges = await ctx.runQuery(
        internal.eventTypes.getGaugeCountsByEventType
      );

      // Build a map of interest → eventSuggestion from Claude
      const suggestionMap = new Map<string, { eventName: string; venueType: string; description?: string }>();
      for (const s of eventSuggestions) {
        suggestionMap.set(s.interest.toLowerCase(), {
          eventName: s.eventName,
          venueType: s.venueType,
          description: s.description,
        });
      }

      // ── Semantic matching via Claude ──
      // One fast call to map all extracted interests to existing event types
      const eventTypeEntries = Object.entries(eventTypeGauges).map(
        ([name, d]) => `${name} (${d.displayName})`
      );
      let claudeMatchMap: Record<string, string | null> = {};
      if (eventTypeEntries.length > 0) {
        try {
          const matchResponse = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [
              {
                role: "user",
                content: `Match each interest to the most semantically related event type. Only match if there's a real connection.

Interests: ${interests.map((i) => i.canonicalValue).join(", ")}

Event types: ${eventTypeEntries.join(", ")}

Return ONLY JSON: {"interest_value": "event_type_name" | null}
Example: {"rock climbing": "climbing_session", "cooking": "dinner_party", "quantum physics": null}`,
              },
            ],
          });
          const matchText =
            matchResponse.content[0].type === "text"
              ? matchResponse.content[0].text
              : "";
          const jsonMatch = matchText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            claudeMatchMap = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn("Claude semantic matching failed, falling back:", e);
        }
      }

      // Collect matched event type names for storage
      const matchedEventTypeNames: string[] = [];

      let traceDelay = 0;
      for (const interest of interests) {
        const cv = interest.canonicalValue.toLowerCase();
        // Use Claude's semantic match first, fall back to INTEREST_MAP
        const claudeMatchName = claudeMatchMap[cv] ?? claudeMatchMap[interest.canonicalValue];
        const match =
          claudeMatchName && eventTypeGauges[claudeMatchName]
            ? { etName: claudeMatchName, data: eventTypeGauges[claudeMatchName] }
            : matchInterestToEventType(cv, eventTypeGauges);

        // Trace: searching
        await ctx.runMutation(internal.ideate.saveIdeateTrace, {
          userId: user._id,
          sessionId: SESSION_ID,
          traceType: "searching_people",
          content: `Scanning SF for ${interest.canonicalValue} people...`,
          metadata: { eventTypeName: match?.data.displayName },
          timestamp: Date.now() + traceDelay,
        });
        traceDelay += 400;

        if (match) {
          matchedEventTypeNames.push(match.etName);
          // Known interest — auto-gauge "yes" and show trace
          await ctx.runMutation(
            internal.matchAndCreateEventsHelpers.autoGaugeYes,
            { userId: user._id, eventTypeId: match.data.eventTypeId }
          );

          const totalYes = match.data.yesCount + 1; // +1 for this user
          await ctx.runMutation(internal.ideate.saveIdeateTrace, {
            userId: user._id,
            sessionId: SESSION_ID,
            traceType: "found_match",
            content: `${totalYes} people interested in ${match.data.displayName} — ${totalYes >= 3 ? "enough to set up an event!" : "gauging interest..."}`,
            metadata: {
              matchedCount: totalYes,
              eventTypeName: match.data.displayName,
            },
            timestamp: Date.now() + traceDelay,
          });
          traceDelay += 400;
        } else {
          // Novel interest — create eventType + auto-gauge "yes"
          // No event yet — it'll appear as a GaugingCard in everyone's For You
          const suggestion = suggestionMap.get(cv);
          const etName = cv.replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
          const displayName =
            suggestion?.eventName ??
            `${interest.canonicalValue.charAt(0).toUpperCase() + interest.canonicalValue.slice(1)} Meetup`;
          const venueType = suggestion?.venueType ?? "outdoor_park";

          const eventTypeId = await ctx.runMutation(
            internal.matchAndCreateEventsHelpers.createEventType,
            { name: etName, displayName, venueType, description: suggestion?.description }
          );
          matchedEventTypeNames.push(etName);

          // Auto-gauge "yes" for this user
          await ctx.runMutation(
            internal.matchAndCreateEventsHelpers.autoGaugeYes,
            { userId: user._id, eventTypeId }
          );

          // Generate image for the new event type (async — Convex reactivity updates UI when done)
          try {
            await ctx.runAction(internal.generateEventImages.generateEventImage, {
              eventTypeId: eventTypeId as any,
              displayName,
              activity: interest.canonicalValue,
            });
          } catch (e) {
            console.warn(`Image generation failed for "${displayName}":`, e);
          }

          await ctx.runMutation(internal.ideate.saveIdeateTrace, {
            userId: user._id,
            sessionId: SESSION_ID,
            traceType: "found_match",
            content: `Created "${displayName}" — gauging interest from others in SF...`,
            metadata: { eventTypeName: displayName },
            timestamp: Date.now() + traceDelay,
          });
          traceDelay += 400;
        }
      }

      // Run matching engine — creates events for any eventType with 3+ yes gauges
      await ctx.runAction(
        internal.matchAndCreateEvents.matchAndCreateEvents,
        {}
      );

      // Save assistant message (after processing so we can include matchedEventTypeNames)
      await ctx.runMutation(internal.ideate.saveIdeateLog, {
        userId: user._id,
        sessionId: SESSION_ID,
        role: "assistant",
        content: displayText,
        extractedInterests: interests.map((i) => i.canonicalValue),
        matchedEventTypeNames:
          matchedEventTypeNames.length > 0
            ? matchedEventTypeNames
            : undefined,
        timestamp: Date.now(),
      });
    } else {
      // No interests extracted — save assistant message without matches
      await ctx.runMutation(internal.ideate.saveIdeateLog, {
        userId: user._id,
        sessionId: SESSION_ID,
        role: "assistant",
        content: displayText,
        timestamp: Date.now(),
      });
    }

    return {
      message: displayText,
      extractedInterests: interests,
    };
  },
});
