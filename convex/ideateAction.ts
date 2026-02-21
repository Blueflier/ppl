"use node";

import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";

const SESSION_ID = "main";

const SYSTEM_PROMPT = `You are ppl's ideation assistant — a warm, curious conversationalist helping people in San Francisco discover what they're really into so we can match them with the right people and events.

Your job:
- Be warm, curious, and concise (2-4 sentences per reply).
- Ask follow-up questions about WHY they enjoy things, not just what.
- Surface deeper motivations: "What draws you to that?" "What's the best part?"
- When you're confident about an interest, extract it as structured JSON in a fenced block.

To extract interests, include a fenced block like this in your response:
\`\`\`interests
[{"category":"hobby","canonicalValue":"jazz piano","rawValue":"playing jazz piano"}]
\`\`\`

Categories: hobby, problem, learning, skill
- hobby: things they do for fun
- problem: problems they want to solve or causes they care about
- learning: things they want to learn
- skill: skills they have and could share

Rules:
- Only extract when you have enough context (don't extract from vague mentions).
- canonicalValue should be a short, normalized form (lowercase, no articles).
- rawValue should be close to what the user actually said.
- You can extract multiple interests in one block.
- Don't re-extract interests the user already has (listed below).
- For returning users, notice category gaps and gently probe.
- Never mention the JSON extraction to the user — keep it invisible.
- Keep conversation natural. You're a friend, not a form.`;

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
} {
  const interestBlocks: {
    category: "hobby" | "problem" | "learning" | "skill";
    canonicalValue: string;
    rawValue: string;
  }[] = [];
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
    .trim();

  return { displayText, interests: interestBlocks };
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
      max_tokens: 512,
      system,
      messages,
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    const { displayText, interests } = parseResponse(rawText);

    // Save extracted interests
    if (interests.length > 0) {
      await ctx.runMutation(internal.ideate.saveIdeateInterests, {
        userId: user._id,
        interests,
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

    return {
      message: displayText,
      extractedInterests: interests,
    };
  },
});
