"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

export const generateEventImage = internalAction({
  args: {
    eventTypeId: v.id("eventTypes"),
    displayName: v.string(),
    activity: v.optional(v.string()),
  },
  handler: async (ctx, { eventTypeId, displayName, activity }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

    // Use activity (the actual interest like "country dancing") for the prompt,
    // falling back to displayName only if activity isn't provided
    const subject = activity ?? displayName.replace(/meetup|mixer|session|club|night/gi, "").trim();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux.2-klein-4b",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `A clean flat-style illustration of objects and items associated with ${subject} — arranged as a still life or top-down flat lay. Show only physical objects like equipment, tools, food, gear, etc. No people, no faces, no hands, no text, no letters, no words. Soft pastel background, warm lighting, minimal and modern aesthetic.`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${err}`);
    }

    const result = await response.json();
    const imageUrl =
      result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      throw new Error("No image returned from OpenRouter");
    }

    // Convert base64 data URL to blob
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Buffer.from(base64Data, "base64");
    const blob = new Blob([binaryData], { type: "image/png" });

    const storageId = await ctx.storage.store(blob);

    await ctx.runMutation(internal.eventTypes.setEventTypeImage, {
      eventTypeId,
      imageStorageId: storageId,
    });
  },
});

export const generateAllEventImages = internalAction({
  args: {},
  handler: async (ctx) => {
    const eventTypes = await ctx.runQuery(api.eventTypes.getEventTypes);

    for (const et of eventTypes) {
      if (!et.imageStorageId) {
        console.log(`Generating image for: ${et.displayName}`);
        await ctx.runAction(internal.generateEventImages.generateEventImage, {
          eventTypeId: et._id,
          displayName: et.displayName,
          activity: et.name.replace(/_/g, " "),
        });
        // Brief pause between requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("Done generating all event images.");
  },
});
