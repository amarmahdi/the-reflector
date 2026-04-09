# Agent S1 — The Oracle (AI Weekly Verdict): Complete

## Summary

Wired the Gemini AI backend into the Weekly Review screen as "The Oracle" — a passive entity that delivers a single brutal analysis paragraph based on the user's week. Also added a teaser card on the home screen visible on Sundays and Mondays.

## Files Created

### `mobile/lib/oracle.ts`
- `fetchOracleVerdict(): Promise<string | null>` — main function
  - Checks auth state (requires login)
  - Checks AsyncStorage cache keyed by week's Monday timestamp
  - Gathers last 7 days of journal entries (capped at 500 chars per body for token efficiency)
  - Gathers last 7 days of discipline snapshots
  - Gathers wound tracker state
  - Calls `POST /analyze/journal` via `apiClient.ts`
  - Composes verdict from response summary + first insight + high-risk warning
  - Caches in `reflector-oracle-verdict` AsyncStorage key
  - Returns `null` on any failure — never crashes
- `getCachedOracleVerdict(): Promise<string | null>` — cache-only read for home screen teaser

## Files Modified

### `mobile/app/weekly-review.tsx`
- Added imports: `withRepeat` from reanimated, `fetchOracleVerdict` from oracle
- Added Oracle styled components:
  - `OracleCard` — dark surface1 card with 4px warmRed left border
  - `OracleHeader` — "THE ORACLE SPEAKS" label, 9px, weight 700, spacing 3px, warmRed
  - `OracleBody` — verdict text, 14px, weight 500, italic, textSecondary, line-height 22px
  - `OracleShimmer` — loading placeholder bars
- Added state: `oracleVerdict`, `oracleLoading`
- Added fetch on mount with graceful error handling
- Added pulsing glow animation on the border using `withRepeat` + `withTiming`
- Inserted Oracle card at the TOP of the review (above score ring)
  - Shows shimmer loading state while fetching
  - Shows verdict card with glow when loaded
  - Hides entirely if no verdict available

### `mobile/app/index.tsx`
- Added import: `getCachedOracleVerdict` from oracle
- Added Oracle teaser styled components:
  - `OracleTeaserCard` — pressable card with warmRed left border
  - `OracleTeaserLabel` — "THE ORACLE SPEAKS" mini label
  - `OracleTeaserText` — first sentence of verdict, italic
  - `OracleTeaserLink` — "Read the full verdict →" in warmRed
- Added state + effect: checks day of week, only loads on Sun/Mon
- Extracts first sentence for teaser display
- Navigates to `/weekly-review` on tap
- Shows nothing if no cached verdict exists

## Design Principles
- The Oracle is NOT a chatbot — no input, no "ask" button, it DELIVERS judgment
- Uses existing design system: COLORS, styled-components/native, reanimated
- Never crashes if API is down — graceful fallback to hiding the card
- Matches the dark/sacred aesthetic

## Verification
- `npx tsc --noEmit` — zero errors
- Agent S2's labels (stoic voice) preserved — no overwrites
