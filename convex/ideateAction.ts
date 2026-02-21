"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import {
  VENUE_SUGGESTIONS,
  matchInterestToEventType,
} from "./matchingUtils";

const SESSION_ID = "main";

const SYSTEM_PROMPT = `You're a chill concierge connecting people in SF. Ultra casual, brief.

CORE RULE: Extract interests fast. Don't interrogate.
- Clear interest ("i like basketball") → extract immediately, say "Nice, got it! What else?"
- Ambiguous ("i like jazz") → ONE follow-up max: "Listening or playing?" → then extract
- NEVER ask about: skill level, experience, equipment, logistics, hosting
- After extracting, always nudge for the next interest

Follow-up triggers (ONLY these warrant a question):
- Activity could mean very different event types (jazz listening vs jazz playing)
- Group size matters for the event format (pickup basketball vs 3v3)
- That's it. Everything else, just extract and move on.

When you understand a clear interest, quietly extract it (never mention this to the user):
\`\`\`interests
[{"category":"hobby","canonicalValue":"jazz piano","rawValue":"playing jazz piano"}]
\`\`\`
Categories: hobby, problem, learning, skill. Only extract when specific enough. canonicalValue=short lowercase. Skip already-known interests.

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
  hosting: { willingness: "willing" | "not_willing" | "depends" } | null;
} {
  const interestBlocks: {
    category: "hobby" | "problem" | "learning" | "skill";
    canonicalValue: string;
    rawValue: string;
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
    .trim();

  return { displayText, interests: interestBlocks, hosting };
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
    const { displayText, interests, hosting } = parseResponse(rawText);

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

    // Save assistant message
    await ctx.runMutation(internal.ideate.saveIdeateLog, {
      userId: user._id,
      sessionId: SESSION_ID,
      role: "assistant",
      content: displayText,
      extractedInterests:
        interests.length > 0
          ? interests.map((i) => i.canonicalValue)
          : undefined,
      timestamp: Date.now(),
    });

    // ── Generate real-data traces for extracted interests ──
    if (interests.length > 0) {
      // Clear old traces before writing new batch
      await ctx.runMutation(internal.ideate.clearTraces, {
        userId: user._id,
        sessionId: SESSION_ID,
      });

      // Fetch real gauge data
      const eventTypeGauges = await ctx.runQuery(
        internal.eventTypes.getGaugeCountsByEventType
      );

      let traceDelay = 0;
      for (const interest of interests) {
        const match = matchInterestToEventType(
          interest.canonicalValue,
          eventTypeGauges
        );

        // Trace 1: searching_people
        await ctx.runMutation(internal.ideate.saveIdeateTrace, {
          userId: user._id,
          sessionId: SESSION_ID,
          traceType: "searching_people",
          content: `Scanning SF for ${interest.canonicalValue} people...`,
          metadata: { eventTypeName: match?.data.displayName },
          timestamp: Date.now() + traceDelay,
        });
        traceDelay += 400;

        if (match && match.data.yesCount > 0) {
          // Trace 2: found_match (with real count)
          await ctx.runMutation(internal.ideate.saveIdeateTrace, {
            userId: user._id,
            sessionId: SESSION_ID,
            traceType: "found_match",
            content: `Found ${match.data.yesCount} people interested in ${match.data.displayName}`,
            metadata: {
              matchedCount: match.data.yesCount,
              eventTypeName: match.data.displayName,
            },
            timestamp: Date.now() + traceDelay,
          });
          traceDelay += 400;

          // Find venue type for this event type
          const allEventTypes = await ctx.runQuery(api.eventTypes.getEventTypes);
          const etData = allEventTypes.find(
            (et: { name: string }) => et.name === match.etName
          );
          const venueType = etData?.venueType;
          const venueInfo = venueType
            ? VENUE_SUGGESTIONS[venueType]
            : null;

          if (venueInfo) {
            // Trace 3: searching_venue
            await ctx.runMutation(internal.ideate.saveIdeateTrace, {
              userId: user._id,
              sessionId: SESSION_ID,
              traceType: "searching_venue",
              content: `Looking for ${venueInfo.desc}...`,
              metadata: { eventTypeName: match.data.displayName },
              timestamp: Date.now() + traceDelay,
            });
            traceDelay += 400;

            // Trace 4: found_venue
            await ctx.runMutation(internal.ideate.saveIdeateTrace, {
              userId: user._id,
              sessionId: SESSION_ID,
              traceType: "found_venue",
              content: `Found ${venueInfo.name}`,
              metadata: {
                venueName: venueInfo.name,
                venueLocation: { lat: venueInfo.lat, lng: venueInfo.lng },
                eventTypeName: match.data.displayName,
              },
              timestamp: Date.now() + traceDelay,
            });
            traceDelay += 400;
          }
        }
      }
    }

    // ── Run matching engine to create events from interests ──
    if (interests.length > 0) {
      await ctx.runAction(internal.matchAndCreateEvents.matchAndCreateEvents, {});
    }

    return {
      message: displayText,
      extractedInterests: interests,
    };
  },
});
