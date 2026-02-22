"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { VENUE_SUGGESTIONS } from "./matchingUtils";

const VENUE_TYPE_LIST = Object.keys(VENUE_SUGGESTIONS).join(", ");

export const generateOnboardingEvents = action({
  args: {
    answers: v.array(
      v.object({
        questionId: v.string(),
        questionText: v.string(),
        values: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { answers }) => {
    const answersText = answers
      .map((a) => `${a.questionText}: ${a.values.join(", ")}`)
      .join("\n");

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Based on this person's onboarding answers, generate exactly 5 fun, specific event ideas for SF meetups. Make them creative and social — not generic.

${answersText}

Each event needs:
- name: lowercase_snake_case identifier
- displayName: catchy event title (2-4 words). Be creative — DON'T default to "[Topic] Mixer" or "[Topic] Meetup". Use vivid, specific names like "Sunset Jam Session", "Golden Gate Run Club", "Dim Sum & Debate", "Hack Night at the Park".
- venueType: one of [${VENUE_TYPE_LIST}]
- description: fun 1-2 sentence description of the vibe
- activity: the core activity (for image generation)

Return ONLY a JSON array:
[{"name":"...", "displayName":"...", "venueType":"...", "description":"...", "activity":"..."}]`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to parse onboarding events:", rawText);
      return [];
    }

    const events: {
      name: string;
      displayName: string;
      venueType: string;
      description: string;
      activity: string;
    }[] = JSON.parse(jsonMatch[0]);

    const createdIds: string[] = [];

    for (const event of events.slice(0, 5)) {
      const name = event.name.replace(/[^a-z0-9_]/g, "");

      const eventTypeId = await ctx.runMutation(
        internal.matchAndCreateEventsHelpers.createEventType,
        {
          name,
          displayName: event.displayName,
          venueType: event.venueType,
          description: event.description,
        }
      );

      createdIds.push(eventTypeId as string);

      // Fire off image generation (don't await — let Convex reactivity handle it)
      ctx.runAction(internal.generateEventImages.generateEventImage, {
        eventTypeId: eventTypeId as any,
        displayName: event.displayName,
        activity: event.activity,
      }).catch((e) =>
        console.warn(`Image gen failed for "${event.displayName}":`, e)
      );
    }

    return createdIds;
  },
});
