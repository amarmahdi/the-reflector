Phase 2b Refactoring Complete.

1.  **Focus Timer Screen (`app/focus.tsx`)**: Replaced local styled components with `@/components/ui` primitives (Screen, PrimaryButton, GhostButton, SectionLabel). Uses `useTodaySessions` to replace manual Zustand getter for type safety.
2.  **Insights Screen (`app/insights.tsx`)**: Cleaned up the local styling to use the shared primitives `Screen`, `EmptyState`, `SectionHeader`, `Card`, `StatPill`, and `ProgressBar`. Utilized the `useWeekFocusMinutes` hook instead of relying on a local `weekFocusMinutes` call. Fixed syntax and build errors introduced by the refactor script.
3.  **FocusStats Component (`components/FocusStats.tsx`)**: Switched over to safe hook selectors `useTodayCompletedCount`, `useTodayFocusMinutes`, and `useFocusStreakDays`.

No build or type issues found running `npx tsc --noEmit`. No modifications were made to the shared models or `theme.ts`, exactly adhering to the `MODULAR_RULES.md`.
