# Agent S2 — Copywriting Overhaul (The Voice)

## Summary

Rewrite every piece of user-facing text across the app to sound like a stoic philosopher / martial arts sensei — not a generic productivity app. The app should feel heavy, sacred, and intentional. Every label, button, title, and placeholder needs to match this voice.

## Context

- Monorepo: `mobile/` is the React Native app
- Styling: `styled-components/native` + `constants/theme.ts`
- Navigation: Expo Router with Drawer (`app/_layout.tsx`)
- All screens are in `app/` folder

## The Voice

The Reflector speaks like a disciplined mentor. Not aggressive, not cheerful. **Calm but uncompromising.** Think Marcus Aurelius meets a sensei.

- Never use exclamation marks
- Never use casual language ("Hey!", "Awesome!", "Let's go!")
- Use periods. Short sentences. Weight.

## Required Text Changes

### Navigation (`app/_layout.tsx`)

| Current Label | New Label |
|---|---|
| Home | The Path |
| The Forge | The Forge |
| Focus | The Crucible |
| Journal | Reflections |
| Insights | The Mirror |
| Achievements | Marks of Honor |
| Alarms | The Bell |
| Recurring Tasks | Disciplines |
| Weekly Review | Week in Review |
| Settings (footer) | The Sanctum |

Change the `navItems` array labels AND all `Drawer.Screen` `title` options.

### Settings Screen (`app/settings.tsx`)

| Current | New |
|---|---|
| QUICK LINKS | PATHS |
| NOTIFICATIONS | THE BELL |
| WAKE TIME | RISE TIME |
| FIRST REMINDER | FIRST CALL |
| NUDGE EVERY | PERSISTENCE |
| QUIET AFTER | SILENCE AFTER |
| ALARM SOUND | THE BELL'S VOICE |
| DATA | YOUR RECORD |
| BACKUP NOW | PRESERVE YOUR RECORD |
| RESTORE FROM CLOUD | RECOVER YOUR PAST |
| EXPORT DATA | CARRY YOUR RECORD |
| IMPORT DATA | RECEIVE A RECORD |
| CLEAR OLD TASKS | RELEASE OLD BURDENS |
| RESET ALL DATA | BURN EVERYTHING |
| LOG OUT | LEAVE THE SANCTUM |
| SESSION | DEPARTURE |
| CLOUD BACKUP | THE ARCHIVE |
| ACCOUNT | IDENTITY |
| RESCHEDULE NOW | RESET THE BELL |

### Fire Screen (`app/fire.tsx`)

| Current | New |
|---|---|
| A day was missed. | You broke a promise. |
| Before you move forward, take a moment to reflect on what happened. This isn't punishment — it's awareness. | Before you continue, you must face what happened. This is not punishment. This is truth. |
| Write your reflection... | What defeated you? |
| I understand | I accept this scar. |
| All caught up | The path is clear. |
| No missed days to reflect on. Keep going. | There are no scars to tend. Walk forward. |
| Return Home | Continue the path. |
| Next Reflection | Next wound. |
| CONSEQUENCE | THE COST |

### Home Screen (`app/index.tsx`)

| Current | New |
|---|---|
| EXPLORE | PATHS |
| The Forge | The Forge |
| Your Insights | The Mirror |
| Achievements | Marks of Honor |
| Your Alarms | The Bell |
| + Add task | + Add to today |
| Delete task? | Abandon this task? |
| This action cannot be undone. | This cannot be undone. |

Remove the `QUOTES` array entirely. Replace with a single context-aware line (just leave a placeholder comment `// TODO: S5 will add context-aware line`).

### Weekly Review (`app/weekly-review.tsx`)

| Current | New |
|---|---|
| WEEK IN REVIEW | WEEK IN REVIEW |
| WEEKLY SCORE | YOUR MEASURE |
| ROUTINE DAYS | DAYS HONORED |
| TOTAL SCARS | SCARS EARNED |
| FOCUS MINUTES | CRUCIBLE TIME |
| JOURNAL ENTRIES | REFLECTIONS |
| CURRENT STREAK | THE STREAK |
| VS LAST WEEK | VS LAST WEEK |
| BEST DAY | YOUR STRONGEST DAY |
| WORST DAY | YOUR WEAKEST DAY |
| MOST COMMON MOOD | DOMINANT STATE |
| YOUR TOP EXCUSE | YOUR MOST USED EXCUSE |
| LET'S GO | Seal this week. |
| SET THIS WEEK'S INTENTION | YOUR COMMITMENT FOR THE WEEK |
| What will you commit to this week? | What will you protect this week? |

### Onboarding (`app/onboarding.tsx`)

**Do NOT rewrite the onboarding.** Agent S4 is handling a complete rewrite. Leave this file alone.

### Achievements (`app/achievements.tsx`)

Change screen title in drawer from "Achievements" to "Marks of Honor"

### Other Screens

Scan through these files and update any generic language to match the voice:
- `app/focus.tsx` — rename UI references from "Focus" to "Crucible" where visible to user
- `app/forge.tsx` — keep "The Forge" 
- `app/insights.tsx` — rename header from "Insights" to "The Mirror"

## Rules

- **Do NOT change any logic, state, or behavior.** Only text/labels.
- **Do NOT modify `app/onboarding.tsx`.** That's Agent S4's job.
- **Do NOT add or remove components.** Only change string content.
- **Do NOT touch `fire.tsx` styling/colors.** That's Agent S3's job. Only change text.
- Keep all `styled-components` names the same — just change the text rendered inside them.
- Preserve all comments and docstrings.

## Testing

1. `npx tsc --noEmit` — zero errors
2. Build and visually verify every screen
3. Check the drawer menu labels
4. Check settings section headers
5. Check fire screen text

## When Done

1. Write receipt to `.agents/messages/from-agent-s2/done.md`
2. Commit and push to `main`
