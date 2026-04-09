# Agent S1 — The Oracle (AI Weekly Verdict)

## Summary

Wire the Gemini AI backend into the Weekly Review screen as a passive, observant entity called "The Oracle." It delivers a single brutal paragraph of analysis every Sunday based on the user's journal entries, discipline scores, and failure patterns.

## Context

- Backend endpoint exists: `POST http://142.93.148.160/analyze/journal` (requires JWT auth)
- Auth store exists: `store/useAuthStore.ts` (has `accessToken`, `isLoggedIn`)
- API client exists: `lib/apiClient.ts` (auto-injects JWT)
- Weekly Review screen exists: `app/weekly-review.tsx`
- Home screen exists: `app/index.tsx`
- Discipline data: `store/useDisciplineStore.ts` has daily snapshots
- Journal data: `store/useJournalStore.ts` has all entries
- Correlation engine: `lib/correlationEngine.ts` has pattern analysis
- Design system: `constants/theme.ts` (COLORS, TYPOGRAPHY, SPACING, RADIUS)
- Styled components pattern used throughout

## Files to Create

### `mobile/lib/oracle.ts`

Oracle service module:

```typescript
fetchOracleVerdict(): Promise<string | null>
```

- Gathers last 7 days of journal entries from `useJournalStore`
- Gathers last 7 days of discipline snapshots from `useDisciplineStore`
- Gathers streak info from `useGamificationStore`
- Compresses into a token-efficient payload
- Calls `api('/analyze/journal', { method: 'POST', body: payload })`
- Extracts the summary/insight text from the response
- Caches result in AsyncStorage key `reflector-oracle-verdict` with the week's Monday timestamp
- On subsequent calls in the same week, returns cached version
- Returns `null` if user is not logged in or API fails (never crash the app)

## Files to Modify

### `mobile/app/weekly-review.tsx`

Add an Oracle verdict card at the TOP of the review (above the score ring):

- Import and call `fetchOracleVerdict()` on mount
- Show a loading shimmer while fetching
- Display the verdict in a styled card:
  - Background: `COLORS.surface1` with `COLORS.warmRed` left border (4px)
  - Header: `THE ORACLE SPEAKS` — font-size 9px, weight 700, letter-spacing 3px, color `COLORS.warmRed`
  - Body: The verdict text — font-size 14px, weight 500, italic, color `COLORS.textSecondary`, line-height 22px
  - Subtle pulsing glow animation on the border (use reanimated)
- If no verdict available (not logged in, API failed), don't show the card at all

### `mobile/app/index.tsx` (Home Screen)

Add a small Oracle teaser card in the home screen:

- Place it after the Ghost card section
- If today is Sunday or Monday AND a cached oracle verdict exists:
  - Show a card: first sentence of the verdict + "Read the full verdict →" link to `/weekly-review`
  - Card style: dark, subtle, `COLORS.surface1` background, `COLORS.warmRed` accent
- If no verdict exists, show nothing (don't show a placeholder)

## Design Rules

- The Oracle is NOT a chatbot. No input field. No "ask" button. It DELIVERS judgment.
- Use `styled-components/native` — follow the existing pattern in `weekly-review.tsx`
- Use `react-native-reanimated` for the pulse animation
- Never crash if the API is down — graceful fallback to hiding the card
- Match the existing dark/sacred aesthetic exactly

## Testing

1. Log in with an existing account
2. Navigate to Weekly Review
3. Verify the Oracle card appears with Gemini-generated text
4. Verify it caches (navigate away and back — no re-fetch)
5. Verify home screen teaser shows on Sunday/Monday
6. Verify graceful fallback when not logged in

## When Done

1. Write receipt to `.agents/messages/from-agent-s1/done.md`
2. Commit and push to `main`
