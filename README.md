# PPL

AI-powered social event concierge for San Francisco. Share your interests, get matched with the right people, and receive curated event invites — no organizers needed. The AI handles everything: finding people, picking times and venues, and surfacing invites.

**Live:** [ppl-woad.vercel.app](https://ppl-woad.vercel.app/)

## How it works

1. **Share your interests** — hobbies, curiosities, skills, anything
2. **Gauge events** — swipe yes or no on event types that interest you
3. **Get invites** — AI matches people, picks a time and venue, and sends you an invite

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Convex (database, real-time subscriptions, server functions)
- **AI**: Anthropic Claude API for ideation, interest extraction, and event matching
- **Auth**: Email/password via `@convex-dev/auth`
- **Maps**: Mapbox GL JS
- **Deployment**: Vercel + Convex Cloud

## Local Development

```bash
pnpm install
pnpm dev              # Next.js dev server
npx convex dev        # Convex backend (run alongside pnpm dev)
```

Requires environment variables for Convex, Mapbox, and Anthropic API keys.


