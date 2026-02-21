# PPL — Product Spec v0.1
> AI concierge that organizes real-world events by matching groups of people based on shared interests, passions, and complementary skills. SF only. MVP.

---

## Vision

Users dump their interests, passions, and random thoughts into the app. The AI quietly does the work — finding the right people, picking a time, finding a place — and surfaces an invite that feels like magic. No event organizers. No top-down planning. Just the AI as an invisible host.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (browser, not PWA) |
| Database | Convex |
| Auth | Phone number + SMS OTP |
| SMS | Twilio |
| AI / LLM | Claude API (`claude-sonnet-4-6`) |
| Matching model | PyTorch service (see `/pytorch`) |
| Calendar | Google Calendar OAuth |
| Venues | Google Places API |
| Hosting | Vercel + Convex Cloud |

---

## Navigation

```
Bottom tabs: [ Explore ] [ Ideate ] [ Me ]

Explore → top tabs: [ For You ] [ Friends ]

For You: mix of gauging cards + rsvp cards
Friends: events friends have opted to share
```

---

## Screens

### 1. Onboarding
- Phone number input → Twilio OTP → user record created
- 6 quick questions with bubble answers:
  1. **Are you into athletics?** → Yes | No
  2. **What do you like talking about?** → Tech | Business | Philosophy | Pop culture | Science | Art | Sports | Politics
  3. **Are you learning anything right now?** → A language | A skill | A subject | Always learning | Not actively
  4. **What do you want more of?** → New friends | Collaborators | Community | All of the above
  5. **What would make you show up?** → It's competitive | I'd learn something | I'd create something | Good people will be there
  6. **What's one thing you've always wanted to do but never organized?** → [open text input]
- → Save answers as `interests` records (source: `"onboarding"`)
- → Show 5 gauging cards instantly based on answers
- → Prompt: connect Google Calendar (or skip → manual availability screen)
- → Navigate to Ideate with a prompt: "Tell us more so we can find your people"
- → Guided tour overlay highlights the 3 tabs (minimal text, tap-to-continue)

### 2. Ideate Tab
- Conversational chat UI (Claude API)
- Opening message: *"What problems do you want to solve? What are you into? What do you want to learn?"*
- AI asks follow-up WHY questions to get at core motivations:
  - "Why do you want to learn Spanish?" → infers relationship context, finds couples events
  - "What kind of founders do you want to meet?" → tech vs non-tech complementarity
  - "Have you ever played music with others?" → surfaces role for jazz_jam etc.
- AI accumulates a satisfaction score internally. When confident enough:
  - Outputs structured interest JSON
  - Saves new `interests` records (source: `"ideate"`)
  - Sends a closing message: *"Got it — finding your people now..."*
  - **Triggers matching engine**
- Returning users: AI surfaces follow-up questions based on gaps in their profile
- Users can also propose event ideas here: "I want to do an escape room with a group" → AI creates a new event archetype or matches to existing one

### 3. Explore Tab — For You

Two card types live in the same feed:

#### Gauging Card
```
┌─────────────────────────────────┐
│ Would you go to a Jazz Jam?     │
│                                 │
│ 4 people nearby are interested  │
│                                 │
│  [ Yes, I'd go ]  [ Not for me ]│
└─────────────────────────────────┘
```
- No time, no place yet
- Feeds threshold detection
- Teaches AI user's event taste
- User responses saved to `eventGauges`

#### RSVP Card
```
┌─────────────────────────────────┐
│ Jazz Jam                        │
│ The Jam Spot · Sat Mar 7 · 7pm  │
│ 5 others going                  │
│                                 │
│ ✦ Matched because: jazz drums   │
│ 🏠 Maya is open to hosting      │
│                                 │
│  [ Can Go ]  [ Unavailable ]    │
│  ⏱ 18 hours left to respond     │
└─────────────────────────────────┘
```
- Has time + place
- Shows match reason (bridging interest)
- Shows host if someone said yes to hosting
- 24hr timer → Convex scheduled function closes it
- Response saved to `rsvps`

#### Search + Filters (top of Explore)
- Keyword search
- Filter by: soonest | most going | matches your profile | connections going

### 4. Explore Tab — Friends
- Events friends have opted to share on their profile
- Shows: friend name, event name, date
- No engagement actions — browse only

### 5. Me Tab
- Name, phone
- Interests list — each interest has an [x] to delete
- Stats row: `12 events · 43 connections · 8 friends`
- Google Calendar: connected/disconnected toggle
- Friends button → Friends Screen

### 6. Friends Screen
- List of accepted friends with event count
- [+] button → search by phone number or username → send friend request
- Pending requests section

### 7. Manual Availability Screen (if no Google Calendar)
- When2Meet-style weekly grid
- User marks available time blocks
- Saved as `manualAvailability` on user record

---

## Event Lifecycle

```
[1] GAUGING
    Matching engine detects enough users match an event archetype
    → Gauging cards pushed to matched users' For You feed
    → Users respond Yes / No

[2] THRESHOLD HIT
    Enough "Yes" responses for event type's minAttendees
    → AI queries Google Calendar for common free slots (or manual availability)
    → AI queries Google Places for venue by venueType
    → AI asks matched users individually: "Would you host at your place for X?"
    → Event record created with time + place (status: pending_rsvp)
    → RSVP cards pushed to users who said Yes

[3] RSVP WINDOW
    24-hour timer (Convex scheduled function)
    Users respond: Can Go / Unavailable

[4a] CONFIRMED
    Enough "Can Go" → event status: confirmed
    Appears in For You feed as a live public event
    All confirmed attendees notified

[4b] COLLAPSED
    Not enough "Can Go" → event status: cancelled
    Prompt to users who said yes: "Still want to go?"
    Users who say yes → see a list of other yeses + the suggested time/place
    No group chat, no contact sharing — just a shared profile list

[5] POST-EVENT
    Event marked completed
    Each attendee prompted: "Who did you enjoy most?" → pick up to 2 people
    Connections auto-formed between all attendees
    Reactions saved → feed back into matching model over time
```

---

## AI Systems

### A. Ideate Chatbot
- Claude API, conversational
- System prompt instructs Claude to:
  1. Ask open-ended questions about interests, problems, learning goals
  2. Ask WHY follow-ups to surface deeper motivations
  3. Extract structured interests into JSON when confident
  4. End conversation gracefully, trigger matching
- Chat history: last 10 messages stored per session in `ideateLogs`
- Output schema per extracted interest:
```json
{
  "category": "hobby" | "problem" | "learning" | "skill",
  "canonicalValue": "jazz drums",
  "rawValue": "I've been playing jazz drums for 3 years",
  "inferredContext": "looking for other musicians to jam with"
}
```

### B. Matching Engine
- PyTorch siamese model (see `/pytorch`)
- Input: user profile embeddings (hobbies, problems, learning goals as multi-hot vectors + age)
- Process:
  1. Encode all user profiles → 64-dim embeddings
  2. For each event archetype, find users whose interests match the archetype cluster
  3. For role-based archetypes (jazz_jam): find complementary role completions — not just cosine similarity but role-slot filling
  4. For homogeneous archetypes (basketball): find enough users with matching interest
  5. When threshold met → create gauging cards
- **Triggers:** after Ideate completion, after user deletes/adds an interest, scheduled every 24h
- For MVP: synthetic training data from `/pytorch/checkpoints`
- Served as an internal API endpoint (Next.js API route calling PyTorch model)

### C. Event Generator
- Triggered when gauging threshold is met
- Steps:
  1. Query Google Calendar API for common availability across matched users
  2. Query Google Places API using venue type from event archetype schema
  3. Compose event record (time, venue, roles filled, match reasons)
  4. Generate match reason copy per user: *"matched because of jazz drums"*
- If no existing archetype matches a user's interests above confidence 0.6:
  - LLM generates a new archetype JSON using the same schema as the 30 seed archetypes
  - New archetype saved to `eventTypes` table permanently

### D. Vocab Expander
- Triggered when LLM encounters an unknown interest term during Ideate
- LLM outputs:
```json
{
  "term": "opsjhdfoajsfas",
  "category": "hobby",
  "inferredMeaning": "unclear — flagged for review",
  "isUserGenerated": true
}
```
- Added to `vocab` table — future users with same raw input get canonical mapping

---

## Convex Schema

```ts
users: {
  id, phone, name, age,
  onboardingComplete: bool,
  calendarConnected: bool,
  calendarRefreshToken: string,        // encrypted
  manualAvailability: string[]         // ["weekday_evenings", "weekend_days"]
}

interests: {
  id, userId,
  category: "hobby" | "problem" | "learning" | "skill",
  canonicalValue: string,
  rawValue: string,
  source: "onboarding" | "ideate" | "inferred",
  isActive: bool                       // false if user deleted it
}

vocab: {
  id, term, category,
  isUserGenerated: bool,
  inferredMeaning: string
}

eventTypes: {                          // 30 seed + LLM-generated
  id, name, displayName,
  requiredRoles: [{ role, min, max, skills[] }],
  venueType: string,
  hostRequired: bool,
  minAttendees: int,
  eventSchema: any
}

events: {
  id, eventTypeId,
  status: "gauging" | "pending_rsvp" | "confirmed" | "cancelled" | "completed",
  venueId?: id,
  scheduledTime?: timestamp,
  matchReason: string,
  hostUserId?: id,
  rsvpDeadline?: timestamp
}

eventGauges: {                         // "would you go to X?" responses
  id, userId, eventTypeId,
  response: "yes" | "no",
  timestamp
}

rsvps: {                               // after time+place are set
  id, userId, eventId,
  response: "can_go" | "unavailable",
  stillWantsToGo?: bool,
  timestamp
}

venues: {
  id, googlePlaceId,
  name, address, venueType,
  isPrivateHome: bool,
  hostUserId?: id
}

friends: {
  id, requesterId, receiverId,
  status: "pending" | "accepted",
  createdAt
}

connections: {                         // auto-formed when both attend same event
  id, userId, connectedUserId, eventId,
  createdAt
}

ideateLogs: {
  id, userId, sessionId,
  role: "user" | "assistant",
  content: string,
  extractedInterests: string[],
  timestamp
}

postEventReactions: {                  // "top 2 people you enjoyed"
  id, userId, reactedToUserId, eventId,
  createdAt
}
```

---

## 30 Seed Event Archetypes

| # | name | display name | roles | venue | min | host? |
|---|------|-------------|-------|-------|-----|-------|
| 1 | `jazz_jam` | Jazz Jam | drummer(1), bassist(1), pianist(1) | indoor_acoustic | 3 | optional |
| 2 | `open_mic` | Open Mic | performers(2+) | indoor_public | 2 | no |
| 3 | `band_practice` | Band Practice | genre-matched instruments | indoor_private | 3 | yes |
| 4 | `electronic_session` | Beat Session | producer(1), synth(1+) | indoor_private | 2 | yes |
| 5 | `classical_ensemble` | Classical Ensemble | violin(1), cello(1), piano(1) | indoor_acoustic | 3 | optional |
| 6 | `3v3_basketball` | 3v3 Basketball | players(6) | outdoor_court | 6 | no |
| 7 | `5v5_soccer` | Pickup Soccer | players(10) | outdoor_field | 10 | no |
| 8 | `pickup_volleyball` | Pickup Volleyball | players(6+) | outdoor | 6 | no |
| 9 | `tennis_doubles` | Tennis Doubles | players(4) | outdoor_court | 4 | no |
| 10 | `group_run` | Group Run | runners(3+) | outdoor | 3 | no |
| 11 | `cycling_ride` | Group Ride | cyclists(3+) | outdoor | 3 | no |
| 12 | `rock_climbing` | Climbing Session | climbers(2+) | gym_or_outdoor | 2 | no |
| 13 | `yoga_session` | Yoga Session | participants(3+) | indoor_or_outdoor | 3 | optional |
| 14 | `founder_roundtable` | Founder Roundtable | tech_founder(1+), non-tech_founder(1+) | indoor_public | 4 | no |
| 15 | `language_exchange` | Language Exchange | speaker_lang_A(1+), speaker_lang_B(1+) | indoor_public | 4 | no |
| 16 | `book_club` | Book Club | readers(4+) | indoor_private_or_cafe | 4 | optional |
| 17 | `philosophy_debate` | Philosophy Debate | participants(4+) | indoor_public | 4 | no |
| 18 | `documentary_screening` | Doc Night | viewers(3+) | indoor_private | 3 | yes |
| 19 | `photography_walk` | Photo Walk | photographers(2+) | outdoor | 2 | no |
| 20 | `creative_writing_circle` | Writing Circle | writers(3+) | indoor_public | 3 | no |
| 21 | `hackathon_mini` | Mini Hackathon | engineer(1+), designer(1+) | indoor_coworking | 3 | no |
| 22 | `3d_printing_workshop` | 3D Printing Session | makers(2+) | makerspace | 2 | no |
| 23 | `board_game_night` | Board Game Night | players(4+) | indoor_private | 4 | yes |
| 24 | `lan_tournament` | LAN Party | gamers(4+) | indoor_private | 4 | yes |
| 25 | `chess_club` | Chess Club | players(4+, even) | indoor_public | 4 | no |
| 26 | `trivia_night` | Trivia Night | 2+ teams of 3-5 | indoor_public | 6 | no |
| 27 | `hiking_group` | Group Hike | hikers(3+) | outdoor_trail | 3 | no |
| 28 | `urban_sketching` | Urban Sketching | artists(3+) | outdoor | 3 | no |
| 29 | `dinner_party` | Dinner Party | participants(4-8) | indoor_private | 4 | yes |
| 30 | `couples_activity` | Couples Night | couples(2+) | varies | 4 | optional |

---

## Prioritized Build Order

### Phase 1 — Foundation (Week 1–2)
- [ ] Convex schema setup (all tables)
- [ ] Auth: phone input → Twilio OTP → user record
- [ ] Onboarding: 6 questions → save interests → show mock gauging cards
- [ ] Skeleton of 3 tabs (Explore, Ideate, Me)

### Phase 2 — Core AI (Week 3–4)
- [ ] Ideate chatbot (Claude API + interest extraction + ideateLogs)
- [ ] PyTorch matching service wrapped as Next.js API route
- [ ] Matching triggers after Ideate completion
- [ ] Gauging cards generated and pushed to For You feed
- [ ] Google Calendar OAuth flow + token storage

### Phase 3 — Event Lifecycle (Week 5–6)
- [ ] Google Places venue search by venueType
- [ ] Event creation: time selection (Calendar) + venue + match reason copy
- [ ] RSVP cards on For You feed
- [ ] 24hr timer via Convex scheduled function
- [ ] Event confirmation / collapse logic
- [ ] "Still want to go?" flow → shared profile list
- [ ] Post-event reaction prompt (top 2 people)
- [ ] Auto-form connections

### Phase 4 — Social Layer (Week 7)
- [ ] Friends: add by phone/username, pending/accepted states
- [ ] Friends feed (opt-in per event on Me tab)
- [ ] Me tab: interests list + delete, stats, calendar status
- [ ] Manual availability screen (When2Meet-style fallback)

### Phase 5 — Polish (Week 8)
- [ ] New archetype generation (LLM fallback when no match)
- [ ] Vocab expander for unknown interest terms
- [ ] Search + filters on Explore
- [ ] Onboarding guided tour overlay
- [ ] Match reason copy refinement

---

## Post-MVP (Explicitly Deferred)

- Twilio SMS pings for event notifications
- Squad/group matching (groups matched as a unit)
- Anti-ghosting reliability point system
- Scan-to-verify attendance via lat/lon graph
- Host budget ($50 stipend)
- ID verification / tiered safety system
- Scraped public events from Eventbrite/Facebook
- Venue reservations
- Native iOS app / PWA
- Real training data for PyTorch model (replace synthetic)
- Travel mode (ping events when visiting another city)

---

## Resolved Decisions

1. **App name** — PPL
2. **PyTorch serving** — runs locally via Next.js API route. Acceptable for MVP demo.
3. **Google Places** — using live API.
4. **Ideate session persistence** — one ongoing conversation per user, like a friend. Full history stored in `ideateLogs`.
5. **RSVP card ordering** — soonest deadline surfaces first.
