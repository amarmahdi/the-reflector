# Task: Ghost of Yesterday

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
A card on the home screen that shows what your past self did (or didn't do) yesterday. It uses your own failure reasons against you and celebrates your wins.

## No New Store Needed
This reads entirely from existing data: `useReflectorStore` (grids, dailyCheckIns) and `useFocusStore` (focusSessions).

## Component: `components/GhostCard.tsx`

### Logic
1. Get yesterday's date (start-of-day epoch)
2. For each active grid, check yesterday's GridDay status
3. Get yesterday's focus sessions and total minutes
4. Get yesterday's journal entries

### Display States

**A) Yesterday was PERFECT (all grids completed):**
```
┌──────────────────────────────────┐
│  👻  GHOST OF YESTERDAY          │
│                                  │
│  Yesterday, you completed        │
│  Morning Block at 7:14 AM.       │
│  Day 23. You showed up.          │
│                                  │
│  "Will you match that today?"    │
└──────────────────────────────────┘
```
- Card border: subtle COLORS.crimson glow
- Text: warm, encouraging

**B) Yesterday had MISSES:**
```
┌──────────────────────────────────┐
│  👻  GHOST OF YESTERDAY          │
│                                  │
│  Yesterday, you skipped          │
│  Deep Work.                      │
│  Your excuse: "Felt tired."      │
│                                  │
│  "Is that who you are?"          │
│  Break the pattern.              │
└──────────────────────────────────┘
```
- Card border: subtle COLORS.warmRed glow
- Shows the actual `failureReason` from the scarred GridDay
- Text: direct, confrontational (not mean, just honest)

**C) Yesterday was MIXED:**
```
┌──────────────────────────────────┐
│  👻  GHOST OF YESTERDAY          │
│                                  │
│  ✓ Morning Block ─ Day 23       │
│  ✗ Deep Work ─ "Felt tired"     │
│                                  │
│  "One isn't enough. Show up      │
│   for all of it today."          │
└──────────────────────────────────┘
```

**D) Active STREAK:**
```
┌──────────────────────────────────┐
│  🔥  7 days straight.            │
│  Past-you is proud.              │
│  Don't let them down.            │
└──────────────────────────────────┘
```
- Only shows when streak ≥ 3 AND yesterday was perfect

**E) No active grids / first day:**
- Don't render the component at all

### Quotes Bank
Create a `lib/ghostQuotes.ts` with rotating challenge/encouragement quotes:

**On miss:**
- "Is that who you are?"
- "The excuse was louder than the commitment."
- "Same pattern. Different day. Change it."
- "Your future self is watching."
- "Nobody's coming to save you."

**On success:**
- "Will you match that today?"
- "Consistency is character. Keep building."
- "The compound effect is working."
- "Yesterday's discipline is today's foundation."

**On streak:**
- "Past-you is proud. Don't let them down."
- "Momentum is a weapon. Keep swinging."
- "{N} days. You're becoming someone new."
- "The person who started wouldn't recognize you."

Pick randomly each day (seeded by date so it's stable within a day).

## Integration

### `app/index.tsx`
Add `<GhostCard />` between the greeting area and the Hero card section (before `SectionLabel` "TODAY'S FOCUS").

```tsx
import GhostCard from '@/components/GhostCard';
// ...
{/* Ghost of Yesterday */}
<GhostCard />

{/* Existing focus hero card */}
<SectionLabel>TODAY'S FOCUS</SectionLabel>
```

### Styling
- Use `COLORS.surface1` background
- Border: 1px `COLORS.border` (default), glows on success/fail states
- Padding: `SPACING.lg`
- Margin: `0 SPACING.xl SPACING.lg`
- Typography: body text with accent highlights

## Files to Create
1. `components/GhostCard.tsx`
2. `lib/ghostQuotes.ts`

## Files to Modify
1. `app/index.tsx` — add GhostCard import and placement

## DO NOT
- Create any new stores
- Modify existing store logic
- Change existing components

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f2.md`

### When Done
Write your completion report to `.agents/messages/from-agent-f2/done.md`

### If Stuck
Write `.agents/messages/from-agent-f2/blocker.md`
