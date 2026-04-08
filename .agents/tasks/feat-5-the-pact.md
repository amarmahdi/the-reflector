# Task: The Pact (Accountability Contract)

**READ `.agents/MODULAR_RULES.md` FIRST.**

## Overview
Before starting any 40-day grid, the user signs a solemn contract with themselves. The pact is sealed, uneditable, and shown every time they try to skip.

## Data Model

### Add to `types/models.ts`:
```ts
/** A signed accountability pact bound to a grid */
export interface Pact {
  id: string;
  gridId: string;
  /** "Why does this routine matter to you?" — min 50 chars */
  why: string;
  /** "What will you sacrifice if you quit?" */
  sacrifice: string;
  /** "What do you earn if you complete all 40 days?" */
  reward: string;
  /** User's typed name as digital signature */
  signedName: string;
  signedAt: number;       // epoch ms
}
```

### Add to `ReflectorState` in `store/useReflectorStore.ts`:
```ts
pacts: Pact[];

// Actions
signPact: (pact: Omit<Pact, 'id' | 'signedAt'>) => void;
getPactForGrid: (gridId: string) => Pact | undefined;
```

## New Screen: `app/pact.tsx`

A solemn, full-screen form with 4 steps:

### Step 1: WHY
```
┌──────────────────────────────────┐
│                                  │
│  📜 THE PACT                     │
│                                  │
│  Before you begin, answer        │
│  honestly:                       │
│                                  │
│  Why does this routine           │
│  matter to you?                  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ [multiline input, min 50]  │  │
│  │                            │  │
│  └────────────────────────────┘  │
│                                  │
│  [Next →]                        │
└──────────────────────────────────┘
```

### Step 2: SACRIFICE
```
"What will you sacrifice if you quit before day 40?"
```
Example placeholder: *"No gaming for a week"*

### Step 3: REWARD
```
"What do you earn when you complete all 40 days?"
```
Example placeholder: *"New sneakers, guilt-free"*

### Step 4: SIGN
```
┌──────────────────────────────────┐
│                                  │
│  📜 SEAL YOUR PACT               │
│                                  │
│  "I commit to completing         │
│   [Routine Name] for 40 days.    │
│   If I fail, I sacrifice         │
│   [sacrifice]. If I succeed,     │
│   I earn [reward]."              │
│                                  │
│  Your name:                      │
│  ┌────────────────────────────┐  │
│  │ [text input]               │  │
│  └────────────────────────────┘  │
│                                  │
│  [Hold to Sign — 3 seconds]     │  ← Long-press Pressable
│                                  │
└──────────────────────────────────┘
```

The "Hold to Sign" button requires a 3-second long press (use `react-native-reanimated` for progress animation). On complete, haptic.heavy() fires, pact is saved, and user is navigated back.

### Navigation
- Route: `app/pact.tsx`
- Params: `gridId` (the grid being started)
- Called from `app/forge.tsx` after creating a new grid. 

Instead of navigating directly to the grid flow after creation, navigate to `/pact?gridId=xxx` first. After signing, navigate to the grid.

### Visual Style
- Dark, minimal, sacred feeling
- `COLORS.surface0` background
- Gold accent (`COLORS.gold`) for the pact title and sign button
- Large typography for the prompts
- `TYPOGRAPHY.hero` for "THE PACT" header

## Display Existing Pacts

### In `app/flow/[gridId].tsx`:
At the top of the grid detail screen, show a collapsed pact banner:
```
📜 Your pact: "I commit because..."  [Expand]
```
Tappable to expand and show the full pact text.

### In `app/fire.tsx` (important!):
When user is writing a failure reflection, show their pact ABOVE the input:
```
┌──────────────────────────────────┐
│  📜 You promised:                 │
│  "I commit because [why]"        │
│                                  │
│  You said you'd sacrifice:       │
│  "[sacrifice]"                   │
│                                  │
│  Are you giving up on that?      │
└──────────────────────────────────┘
```
This makes the user confront their own words while writing excuses.

## Files to Create
1. `app/pact.tsx`

## Files to Modify
1. `types/models.ts` — add Pact interface
2. `store/useReflectorStore.ts` — add pacts array + actions
3. `app/forge.tsx` — redirect to pact screen after grid creation
4. `app/flow/[gridId].tsx` — add pact banner
5. `app/fire.tsx` — show pact reminder during failure reflection

## DO NOT
- Make pacts optional (every new grid MUST have a pact)
- Allow editing signed pacts
- Change existing grid creation logic (just add a redirect after)

---

## 📬 Communication Protocol

### Before Starting
1. Read `.agents/MODULAR_RULES.md`
2. Read your boss message at `.agents/messages/boss/agent-f5.md`

### When Done
Write your completion report to `.agents/messages/from-agent-f5/done.md`

### If Stuck
Write `.agents/messages/from-agent-f5/blocker.md`
