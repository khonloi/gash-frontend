---
name: quality-verification
description: >-
  Project-specific testing, linting, static type checking, duplicate code checking, and quality
  verification workflow for gash-frontend. Use this skill whenever running tests, linting with ESLint,
  checking types with TypeScript, editing storefront components or chat UI, or verifying changes
  before completion in gash-frontend.
---

# GASH Frontend: Testing, Linting & Quality Verification

Use this workflow to verify code changes, author tests, and enforce storefront quality gates in `d:\Project\gash-frontend`.

## Environment & Tooling

Run verification commands with `pnpm` from `d:\Project\gash-frontend`:

```powershell
# 1. Type-check
pnpm run typecheck

# 2. Lint with ESLint
pnpm run lint

# 3. Duplicate code check
pnpm run lint:duplicates

# 4. Run full Vitest unit & component suite
pnpm test -- --run

# 5. Run Playwright E2E suite
pnpm run test:e2e
```

## Targeted Test Execution

| Subsystem | Test File(s) | Command |
| :--- | :--- | :--- |
| API Client & Demo Mode | `src/lib/apiClient.test.ts`, `src/lib/apiClient.demo.test.ts` | `pnpm test -- --run src/lib/apiClient` |
| Auth & Token Refresh | `src/services/authService.test.ts`, `src/lib/tokenRefresher.test.ts`, `src/store/useAuthStore.test.ts` | `pnpm test -- --run src/services/authService src/lib/tokenRefresher src/store/useAuthStore` |
| Catalog & Cart | `src/services/productService.test.ts`, `src/services/cartService.test.ts`, `src/store/useCartStore.test.ts` | `pnpm test -- --run src/services/productService src/services/cartService src/store/useCartStore` |
| Storefront UI Components | `src/components/ui/**/*.test.tsx` | `pnpm test -- --run src/components/ui` |
| Hybrid AI/Support Chat Widget | `src/components/chat/ChatWidget/ChatWidget.test.tsx` | `pnpm test -- --run src/components/chat/ChatWidget/ChatWidget.test.tsx` |

## Architectural & Quality Invariants

1. **Explicit Demo Mode Respect (`src/lib/apiClient.ts`)**:
   - `isDemoModeActive()` must always respect an explicit `NEXT_PUBLIC_DEMO_MODE=false` environment value so the storefront reads live local/remote backend data rather than falling back to mock fixtures in development (unless explicitly toggled on via `localStorage`).
   - Do not render `<DemoModeBanner />` in `src/app/layout.tsx`.
2. **Real-Time Support Chat Lifecycle (`src/store/useChatStore.ts`, `src/components/chat/ChatWidget/`)**:
   - When a conversation transitions to `closed` (`conversation_status_changed`), clear active conversation state (`conversation: null`, `messages: []`) so the customer starts a fresh session on their next message.
   - Connect Socket.IO via `src/lib/socketClient.ts` with CSP `connect-src` in `next.config.ts` permitting localhost/127.0.0.1 WebSocket origins.
3. **Git Hook Tooling**:
   - `.husky/pre-commit` must invoke `pnpm exec lint-staged` (not `npx lint-staged`).
4. **Offline Determinism**:
   - Vitest component and service tests must mock network calls (`apiClient`, `socketClient`) and never depend on a live backend or MongoDB instance.

## Pre-Completion Verification Checklist

Before declaring any change complete in `gash-frontend`:
1. `pnpm run typecheck` passes with zero TypeScript errors.
2. `pnpm run lint` passes with zero ESLint errors.
3. `pnpm test -- --run` passes 100% of test files and test cases.

