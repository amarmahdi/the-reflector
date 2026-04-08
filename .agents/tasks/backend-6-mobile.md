---
description: "B6 — Mobile Integration: apiClient, login UI, backup controls"
depends_on: [backend-0-restructure, backend-2-auth, backend-3-backup, backend-4-ai]
agent: agent-b6
---

# B6 — Mobile App Integration

## Objective

Connect the React Native frontend (now in `mobile/`) to the FastAPI backend. Create the login screens, auth store, API client, and backup toggles.

## Requirements

You must run inside the `mobile/` directory since B0 moved everything there.

## Files to Create/Modify

### `mobile/lib/apiClient.ts` [NEW]
- Create an Axios instance (if axios installed, else built-in fetch with wrapper).
- Configure `BASE_URL` reading from `process.env.EXPO_PUBLIC_API_URL`.
- Add request interceptor to inject `Authorization: Bearer <token>` from the local Zutsand store.
- Add response interceptor to handle 401s: attempt to call `/auth/refresh`, and if successful, retry the request. If refresh fails, log the user out.

### `mobile/store/useAuthStore.ts` [NEW]
- Zustand store, persisted via AsyncStorage.
- State: `user`, `accessToken`, `refreshToken`, `isLoggedIn`.
- Actions: `login(username, pass)`, `register(username, display, pass)`, `logout()`.

### `mobile/app/login.tsx` [NEW]
- A clean, sacred-aesthetic screen to login or register.
- Use `TextInput` for username/password.
- If registering, show a real-time availability check for the username (debounced typing).
- On success, populate `useAuthStore` and redirect to `app/index.tsx`.

### `mobile/app/_layout.tsx` [MODIFY]
- Implement Auth Gate right inside the layout.
- If `!isLoggedIn`, force navigation to `app/login.tsx` (using Expo Router's `<Redirect>` or `router.replace`).
- Wait for root hydration before routing.

### `mobile/app/settings.tsx` [MODIFY]
- Add "Account" section showing the logged-in username and a Logout button.
- Add "Cloud Backup" section:
  - Text indicating "Last backup: <date>".
  - Button "Backup Now" (calls `POST /backup/upload`).
  - Button "Restore from Cloud" (calls `GET /backup/latest`, then overwrites stores).
  - Toggle switch for "Auto-Sync Daily".

### `mobile/lib/autoBackup.ts` [NEW]
- Helper function that checks the last backup date. If `Auto-Sync Daily` is enabled and it's been >24 hours, fire `/backup/upload` in the background with `is_auto=True`. Hook this up somewhere global (e.g. `_layout` mount).

## Done Criteria

Write completion report to `.agents/messages/from-agent-b6/done.md` confirming:
- App respects the auth gate (redirects to login).
- Login/register UI works and stores tokens.
- Settings screen includes backup controls.
- API Client handles token injection and refresh gracefully.
