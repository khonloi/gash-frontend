---
name: storefront-state-api-and-chat
description: >-
  Client state management, API client demo-mode resolution, token refresh, Socket.IO connection
  lifecycle, and hybrid AI/support ChatWidget behavior in gash-frontend. Use when debugging data
  fetching, auth persistence, cart sync, real-time messaging, or guest/customer chat state.
---

# Storefront State, API Client & Real-Time Chat (`gash-frontend`)

Use this reference when modifying API fetching, Zustand stores, Socket.IO client logic, or the storefront `ChatWidget`.

## API Client & Demo Mode (`src/lib/apiClient.ts`)

- `isDemoModeActive()` evaluates in strict priority order:
  1. `NEXT_PUBLIC_DEMO_MODE` / `DEMO_MODE` === `'true'` -> `true`
  2. `NODE_ENV === 'production'` -> `false` (prevents `localStorage` overrides in prod)
  3. Browser `localStorage.getItem(STORAGE_KEYS.DEMO_MODE)` when present -> `'true'` check
  4. `envDemo === 'false'` -> `false` (ensures `.env` / `.env.local` setting `NEXT_PUBLIC_DEMO_MODE=false` hits the live backend even in development)
  5. Otherwise `NODE_ENV === 'development'` -> `true`.
- Auth token refresh is integrated via `setTokenRefreshHandler` (`src/lib/tokenRefresher.ts`).
- Do not render `<DemoModeBanner />` in `src/app/layout.tsx`.

## Zustand Stores (`src/store/`)

- `useAuthStore.ts`: Persists customer auth state & tokens under `STORAGE_KEYS.AUTH` (`jocksport-auth-storage`).
- `useCartStore.ts`: Manages local/synced cart state (`STORAGE_KEYS.CART`).
- `useChatStore.ts`: Manages floating chat widget state (`isOpen`, `activeConversation`, `messages`, `isAiTyping`, `isAgentTyping`, `aiStreamingText`, `unreadCount`, `draftContextCard`).
- `useToastStore.ts`: Global storefront toast notifications.

## Socket.IO & ChatWidget (`src/lib/socketClient.ts`, `src/components/chat/ChatWidget/`)

- `getChatSocket(token, guestId)` connects with `transports: ['polling', 'websocket']`, infinite reconnection, and a `reconnect_attempt` hook refreshing `auth` credentials from `localStorage` (`STORAGE_KEYS.AUTH`) and `getOrCreateGuestId()`.
- When `token` or `guestId` changes, disconnect and reconnect the socket so the backend Socket.IO middleware re-authenticates and joins the updated `user:` / `guest:` rooms.
- `ChatWidget.tsx` binds `connectSocket()`, polls `syncActiveConversation()` every 3s while open (outside `NODE_ENV === 'test'`), and excludes `closed` conversations in `initConversation()`.
- When a conversation transitions to `'closed'`, clear active conversation/message state so the customer starts fresh on their next message.

## Verification

Run `pnpm test -- --run src/lib/apiClient src/store/useChatStore src/components/chat/ChatWidget` plus `pnpm run typecheck && pnpm run lint`.

