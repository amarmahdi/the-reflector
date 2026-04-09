# Agent S5 — Grid Connection (Tighten the Core)

## Summary

Make the home screen feel like a single-purpose command center where everything feeds the Discipline Score and the 40-day grid. Remove generic motivational quotes and replace them with data-driven, context-aware commentary.

## Dependency

⚠️ **Run AFTER Agent S2 (Copywriting)** — S2 removes the QUOTES array and leaves a TODO comment.

## Context

- Home screen: `app/index.tsx` (~1143 lines)
- Discipline store: `store/useDisciplineStore.ts`
- Discipline engine: `lib/disciplineEngine.ts`
- Ghost quotes: `lib/ghostQuotes.ts`
- Gamification store: `store/useGamificationStore.ts`
- Design system: `constants/theme.ts`
- DisciplineArc component: `components/DisciplineArc.tsx`

## Changes to `app/index.tsx`

### 1. Move DisciplineArc Higher

Currently the DisciplineArc appears somewhere in the home screen. Move it to be the **first visual element** after the greeting section. It should be the first thing you see after your name and date.

### 2. Add a "Today's Verdict" Line

Below the DisciplineArc, add a single context-aware sentence that describes the current state. This replaces the generic `QUOTES` array.

Logic for generating the line:

```typescript
function getTodayVerdict(score: number, yesterdayScore: number, streak: number, tasksComplete: number, tasksTotal: number): string {
  // Score-based
  if (score === 0) return "You haven't started yet. The day is waiting.";
  if (score >= 90) return "You're in command today. Don't let up.";
  if (score >= 70 && yesterdayScore > score) return `${score}. Yesterday was ${yesterdayScore}. Hold the line.`;
  if (score >= 70) return `${score}. Respectable. But you've done better.`;
  if (score >= 50 && score < 70) return `${score}. Mediocre. You know what you need to do.`;
  if (score < 50 && score > 0) return `${score}. The grid remembers days like this.`;

  // Streak-based
  if (streak === 0) return "No streak. Today is day one — again.";
  if (streak >= 30) return `${streak} days. Don't you dare stop now.`;
  if (streak >= 14) return `${streak} days. The momentum is real. Protect it.`;

  // Task-based
  if (tasksTotal > 0 && tasksComplete === tasksTotal) return "All tasks complete. The grid awaits.";
  if (tasksTotal > 0 && tasksComplete === 0) return `${tasksTotal} tasks. None complete. Begin.`;

  return "Show up today. That's all that's asked.";
}
```

- Display this in a subtle text style below the arc
- Font: 13px, weight 500, `COLORS.textSecondary`, italic, centered
- Update in real-time as tasks are completed

### 3. Add a "Today's Status" Micro-Card

Below the verdict line, add a compact status card showing exactly what's pending:

```
┌────────────────────────────────────┐
│  3 of 5 tasks  •  Grid day ✓  •  No journal yet  │
└────────────────────────────────────┘
```

- Single row, horizontal, centered
- Each item separated by `•`
- Items:
  - Tasks: `{complete} of {total} tasks` — green if all done, default if not
  - Grid: `Grid day ✓` or `Grid day pending` — check if today's grid day is completed
  - Journal: `Reflected` or `No reflection yet` — check if any journal entry exists for today
- Style: `COLORS.surface1` background, `COLORS.border` border, 12px text, rounded

### 4. Remove the QUOTES Array

S2 should have already removed it and left a `// TODO: S5` comment. Replace that comment with the `getTodayVerdict()` function.

## Changes to `lib/ghostQuotes.ts`

Make the Ghost of Yesterday quotes **data-aware** where possible:

- Add an optional parameter to `getGhostQuote()` that accepts yesterday's discipline score
- If the score is available, prepend the quote with a data reference:
  - Score < 30: "Yesterday scored ${score}. " + existing quote
  - Score 30-60: "A ${score} day. " + existing quote
  - Score > 80: "Yesterday was strong at ${score}. " + existing quote
- If no score available, return the existing quote unchanged (backward compatible)

## Rules

- Do NOT restructure the home screen layout dramatically — just reorder and add the verdict/status
- Do NOT remove or modify the existing components (GhostCard, MomentumBadge, task list, FAB, etc.)
- Do NOT touch any other screens
- Use `styled-components/native` for new components
- Keep the file maintainable — add new components at the top, don't inline them in the JSX

## Testing

1. Open home screen
2. Verify DisciplineArc is the first visual after the greeting
3. Verify context-aware verdict line updates based on actual score
4. Verify status micro-card shows correct counts
5. Complete a task — verify verdict updates
6. `npx tsc --noEmit` — zero errors

## When Done

1. Write receipt to `.agents/messages/from-agent-s5/done.md`
2. Commit and push to `main`
