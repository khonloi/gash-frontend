# GASH Frontend

[![Next.js](https://img.shields.io/badge/next.js-v16.3-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/react-v19.2-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-v5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/state-zustand%205-brown.svg?style=flat-square)](https://github.com/pmndrs/zustand)
[![TanStack Query](https://img.shields.io/badge/data_fetching-tanstack%20query%205-ff4154.svg?style=flat-square&logo=reactquery)](https://tanstack.com/query)
[![Styling: CSS Modules](https://img.shields.io/badge/styling-CSS%20Modules-4B32C3.svg?style=flat-square&logo=css3)](https://github.com/css-modules/css-modules)
[![Testing: Vitest](https://img.shields.io/badge/testing-vitest%205-729B1B.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Linter: ESLint](https://img.shields.io/badge/linter-eslint%209-4B32C3.svg?style=flat-square&logo=eslint)](https://eslint.org/)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square&logo=prettier)](https://prettier.io)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg?style=flat-square&logo=node.js)](https://nodejs.org/)

An enterprise-grade, high-performance, production-ready e-commerce storefront web application engineered for athletic footwear, apparel, and premium sports gear. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript** in strict mode, **Zustand 5**, **TanStack React Query 5**, **Vitest**, and scoped **CSS Modules**.

---

## Table of Contents

- [Architectural Highlights](#architectural-highlights)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Getting Started](#installation--getting-started)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Security & Networking Architecture](#security--networking-architecture)
  - [Next.js Reverse Proxy & Rewrite Pipeline](#nextjs-reverse-proxy--rewrite-pipeline)
  - [Resilient API Client with Dual-Token Rotation Interceptor](#resilient-api-client-with-dual-token-rotation-interceptor)
  - [Content Security Policy & Hardened Security Headers](#content-security-policy--hardened-security-headers)
  - [XSS Sanitization Engine](#xss-sanitization-engine)
- [State Management & Data Architecture](#state-management--data-architecture)
  - [Client State Architecture (Zustand)](#client-state-architecture-zustand)
  - [Server State & Caching Pipeline](#server-state--caching-pipeline)
  - [Cart Synchronization & Guest-to-User Merge Flow](#cart-synchronization--guest-to-user-merge-flow)
  - [Global Toast Notification System](#global-toast-notification-system)
- [Component & Design System Architecture](#component--design-system-architecture)
  - [Global Design Tokens & CSS Variables](#global-design-tokens--css-variables)
  - [Layout Component Hierarchy](#layout-component-hierarchy)
  - [Reusable UI Component Modules](#reusable-ui-component-modules)
  - [Storefront Pages & Dynamic Routes](#storefront-pages--dynamic-routes)
- [Backend Integration & Schema Transformation](#backend-integration--schema-transformation)
  - [GASH Backend (v2) Contract Alignment](#gash-backend-v2-contract-alignment)
  - [Schema Normalization (`mapProductToFrontend`)](#schema-normalization-mapproducttofrontend)
  - [Resilient Fallback Mode](#resilient-fallback-mode)
- [Testing & Quality Assurance](#testing--quality-assurance)
  - [Test Suite Highlights](#test-suite-highlights)
  - [Running Tests](#running-tests)
- [Production Deployment & Process Management](#production-deployment--process-management)
  - [Optimized Production Build](#optimized-production-build)
  - [Vercel Deployment (Serverless / Edge)](#vercel-deployment-serverless--edge)
  - [Node.js Standalone Runtime & PM2](#nodejs-standalone-runtime--pm2)
- [License](#license)

---

## Architectural Highlights

- **Next.js 16 App Router & React 19 Foundation**:
  - Leverages React Server Components (RSC) for lightning-fast server-side rendering, streaming HTML, and optimal search engine indexability (SEO).
  - Isolates Client Components only where interactive DOM manipulation and client state (Zustand, React Query) are strictly necessary.
- **Resilient API Client with Dual-Token Refresh Rotation**:
  - Built-in request interceptor with a concurrency mutex (`refreshPromise`) that intercepts HTTP `401 Unauthorized` responses.
  - Automatically invokes `/api/v1/auth/refresh-token`, persists new token pairs to localStorage via `useAuthStore`, and transparently replays original requests without disrupting user interactions.
  - Automatic exponential backoff retries for idempotent `GET` queries upon encountering `5xx` transient server errors or network disconnects.
- **Zero-CORS Gateway via Next.js Dynamic Rewrites**:
  - Next.js reverse-proxies `/api/v1/:path*` directly to `gash-backend-v2`, shielding client requests from CORS origin mismatches and cross-origin preflight request latencies.
- **Dual-Tier State Architecture**:
  - **Client State**: Zustand 5 with localStorage persistence for local cart items, authentication credentials, and transient UI toast alerts.
  - **Server State**: TanStack React Query 5 along with React 19 `cache()` memoization layer for high-throughput product catalog queries and background refetching.
- **Comprehensive E-Commerce Purchasing Journey**:
  - Dynamic discovery homepage with hero banner carousel, sport highlights, and editorial journal stories.
  - Multi-faceted collection explorer (`/collections/[slug]`) featuring price sliders, brand/category filters, color/size chips, grid/list view toggles, and sorting controls.
  - Detailed product view (`/products/[slug]`) with multi-angle image galleries, variant selection, real-time inventory low-stock alerts, customer review listings, and tabbed specifications.
  - Full-featured shopping cart system: slide-out drawer (`CartSidebar`), dedicated Cart page (`/cart`), and streamlined two-column checkout (`/checkout`) with coupon application and instant order confirmation.
- **Enterprise-Grade Security & Sanitization**:
  - Pre-configured HTTP response headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict CSP) in `next.config.ts`.
  - Content sanitization with `isomorphic-dompurify` preventing stored Cross-Site Scripting (XSS).
- **High-Performance CSS Modules & Design System**:
  - Scoped CSS Modules (`*.module.css`) with zero runtime CSS-in-JS compilation overhead.
  - Standardized CSS Custom Properties token design system (`globals.css`) delivering high-contrast, athletic-themed visual design.
- **Comprehensive Unit & Integration Test Suite**:
  - Automated testing powered by [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), and [JSDOM](https://github.com/jsdom/jsdom) verifying stores, API client retry logic, schema mappers, and UI rendering.

---

## Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (16.3+) | App Router, Server Components, Route Rewrites & Optimization |
| **Runtime & Library** | [React 19](https://react.dev/) / React DOM | Component rendering, hooks, and React 19 `cache()` memoization |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (5.x) | Strict type safety, IntelliSense, and contract enforcement |
| **Client State** | [Zustand](https://github.com/pmndrs/zustand) (5.0+) | Lightweight client-side stores with persistent LocalStorage middleware |
| **Server State** | [TanStack React Query](https://tanstack.com/query) (5.101+) | Server state synchronization, caching, and background invalidation |
| **Styling** | Vanilla CSS & Scoped CSS Modules | Zero-runtime CSS isolation with centralized design tokens |
| **Icons** | [Lucide React](https://lucide.dev/) (1.31+) | Accessible, tree-shakeable SVG icon collection |
| **Typography** | Geist & Geist Mono (`next/font`) | Optimized zero-layout-shift local font rendering |
| **Security & HTML** | [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) | Safe sanitization of dynamic HTML strings against XSS |
| **Testing** | [Vitest](https://vitest.dev/) (5.0+) & [React Testing Library](https://testing-library.com/) | High-speed unit & integration testing in JSDOM environment |
| **Tooling & Linter** | [ESLint 9](https://eslint.org/) & [Prettier](https://prettier.io/) | Automated code standard enforcement and formatting |

---

## Project Directory Structure

```text
gash-frontend/
├── public/                       # Static public assets (images, icons, brand media)
├── src/
│   ├── app/                      # Next.js App Router (pages, layouts, error boundaries)
│   │   ├── cart/                 # Dedicated cart page
│   │   │   ├── CartClientView.tsx# Client-side interactive cart view
│   │   │   ├── page.module.css   # Cart page scoped styles
│   │   │   └── page.tsx          # Cart route entrypoint
│   │   ├── checkout/             # Multi-step checkout experience
│   │   │   ├── CheckoutClientView.tsx # Interactive shipping, payment & order summary
│   │   │   ├── page.module.css   # Checkout layout & styling
│   │   │   └── page.tsx          # Checkout route entrypoint
│   │   ├── collections/[slug]/   # Dynamic catalog & collection routes
│   │   │   ├── loading.tsx       # Skeleton loading state
│   │   │   ├── page.module.css   # Collection scoped styles
│   │   │   └── page.tsx          # Server component catalog page
│   │   ├── products/[slug]/      # Dynamic product detail pages (PDP)
│   │   │   ├── loading.tsx       # PDP skeleton loading state
│   │   │   ├── not-found.tsx     # Custom 404 for missing products
│   │   │   ├── page.module.css   # Product detail scoped styles
│   │   │   └── page.tsx          # Server component PDP page
│   │   ├── error.tsx             # Root error boundary with recovery action
│   │   ├── globals.css           # Global design tokens, resets, and typography
│   │   ├── layout.tsx            # Root layout with Header, Footer, and ToastContainer
│   │   ├── loading.tsx           # Global initial page load skeleton
│   │   ├── not-found.tsx         # Global 404 Not Found page
│   │   ├── page.module.css       # Home page layout styles
│   │   ├── page.tsx              # Home storefront page (Hero, Curated, Articles)
│   │   ├── robots.ts             # Native Next.js robots.txt generator
│   │   └── sitemap.ts            # Native Next.js dynamic XML sitemap generator
│   ├── components/
│   │   ├── collection/           # Catalog client views & filter wiring
│   │   │   └── CollectionClientView.tsx
│   │   ├── layout/               # Global layout components
│   │   │   ├── Footer/           # Multi-column footer & newsletter
│   │   │   └── Header/           # Sticky Header with Announcement, USP, and Navbar
│   │   │       ├── AnnouncementBar/ # Promotional top alert banner
│   │   │       ├── MainNavbar/      # Mega menu, search bar, cart & account triggers
│   │   │       └── UspBar/          # Unique Selling Proposition highlight bar
│   │   ├── providers/            # React context & client providers
│   │   │   └── ReactQueryProvider.tsx # TanStack Query client configuration
│   │   └── ui/                   # Modular, reusable UI components
│   │       ├── ArticleCard/      # Editorial and fitness journal preview card
│   │       ├── Badge/            # Stock status, discount, and category badges
│   │       ├── BrandCollectionCard/ # Brand showcase banner card
│   │       ├── Breadcrumb/       # Hierarchical navigation breadcrumb
│   │       ├── Button/           # Multi-variant button component (primary, outline, ghost)
│   │       ├── CartSidebar/      # Slide-out interactive cart drawer
│   │       ├── CategoryCircle/   # Circular quick-navigation category card
│   │       ├── Checkbox/         # Custom accessible checkbox input
│   │       ├── CollectionControlBar/ # Layout switches & sorting controls
│   │       ├── EmptyState/       # Empty cart & missing catalog fallback component
│   │       ├── FilterSidebar/    # Multi-faceted filter sidebar (price, brand, size, color)
│   │       ├── HeroCarousel/     # Animated homepage hero carousel
│   │       ├── Input/            # Styled form input field
│   │       ├── Pagination/       # Catalog page navigation controls
│   │       ├── ProductCard/      # Standardized product card with pricing and badges
│   │       ├── ProductGallery/   # Thumbnail selector and main image viewer
│   │       ├── ProductInfo/      # Product purchase actions, variant selectors, stock
│   │       ├── ProductTabs/      # Tabbed specifications, reviews, and delivery details
│   │       ├── PromoBanner/      # Call-to-action marketing banners
│   │       ├── QuantitySelector/ # Increment/decrement counter for cart items
│   │       ├── RadioGroup/       # Accessible radio selection group
│   │       ├── Skeleton/         # Base placeholder loading component
│   │       ├── SportCard/        # Sport category visual tile card
│   │       ├── Toast/            # Global floating toast alert container & toasts
│   │       └── index.ts          # Central UI module export barrel
│   ├── hooks/                    # Reusable React hooks
│   │   ├── useAuth.ts            # Authentication action helpers
│   │   ├── useFocusTrap.ts       # Accessible keyboard focus trapping (drawers/modals)
│   │   ├── useIsMounted.ts       # SSR-safe hydration detection
│   │   └── useProducts.ts        # TanStack Query client hook for catalog queries
│   ├── lib/                      # Infrastructure & utility functions
│   │   ├── apiClient.ts          # Unified HTTP client with token refresh & retry
│   │   ├── apiClient.test.ts     # Unit tests for API client behavior
│   │   ├── cn.ts                 # Classname concatenation helper
│   │   ├── format.ts             # Currency, price, date, and text formatting helpers
│   │   └── format.test.ts        # Unit tests for format helpers
│   ├── services/                 # Remote API integration layer
│   │   ├── authService.ts        # Login, register, token refresh, password recovery
│   │   ├── cartService.ts        # Server cart CRUD and guest merge API endpoints
│   │   ├── productService.ts     # Catalog fetching, handle lookup, schema mapping
│   │   ├── productService.test.ts# Product service & mapping unit tests
│   │   └── userService.ts        # User profile, password updates, address management
│   ├── store/                    # Zustand client state stores
│   │   ├── useAuthStore.ts       # User identity & JWT token storage
│   │   ├── useCartStore.ts       # Local shopping cart, item calculations, persistence
│   │   ├── useCartStore.test.ts  # Cart store operations unit tests
│   │   └── useToastStore.ts      # Global notification state store
│   └── types/                    # Shared TypeScript interfaces & types
│       ├── api.ts                # Standard API response envelopes
│       ├── cart.ts               # Server and client cart models
│       ├── product.ts            # Frontend & Backend product schema contracts
│       └── user.ts               # User profile, auth tokens, addresses
├── .env.example                  # Environment configuration template
├── eslint.config.mjs             # ESLint 9 configuration
├── next.config.ts                # Next.js compiler, headers, and reverse proxy rewrites
├── package.json                  # Manifest, dependencies, and execution scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── vitest.config.ts              # Vitest test runner configuration
└── README.md                     # Complete project documentation
```

---

## Prerequisites

Ensure your local development environment meets the following specifications:

- **Node.js**: `v20.x` or higher (`v22.x` recommended)
- **Package Manager**: [npm](https://www.npmjs.com/) (`v10.x` or higher) or [pnpm](https://pnpm.io/) (`v9.x` or higher)
- **GASH Backend**: Running instance of `gash-backend-v2` listening on `http://localhost:5000` (optional: frontend includes resilient fallback mode for offline/preview development).

---

## Installation & Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/gash-frontend.git
cd gash-frontend
```

### 2. Install Dependencies

Using `npm`:

```bash
npm install
```

Or using `pnpm`:

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy `.env.example` to create your local `.env.local` configuration:

```bash
cp .env.example .env.local
```

Configure your parameters (see [Environment Configuration](#environment-configuration)).

### 4. Run Development Server

```bash
npm run dev
```

The application will be accessible at:
[http://localhost:3000](http://localhost:3000)

---

## Environment Configuration

| Variable | Required | Default | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | No | `3000` | Port on which the Next.js server listens | `3000` |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:5000/api/v1` | Public API URL used by Client Components and direct browser calls | `http://localhost:5000/api/v1` |
| `INTERNAL_API_URL` | No | `http://localhost:5000/api/v1` | Private/Internal backend API URL used for Server-Side Rendering (SSR) | `http://127.0.0.1:5000/api/v1` |
| `BACKEND_INTERNAL_URL` | No | `http://localhost:5000` | Base origin used by Next.js rewrites to proxy backend endpoints | `http://localhost:5000` |
| `NEXT_PUBLIC_SITE_URL` | No | `https://jocksport.com` | Canonical site URL for metadata, OpenGraph, sitemaps, and robots | `https://jocksport.com` |

---

## Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **dev** | `npm run dev` | Launches the Next.js App Router development server with Turbopack / Fast Refresh. |
| **build** | `npm run build` | Compiles and optimizes the full application for production deployment. |
| **start** | `npm run start` | Boots the compiled production server locally on port 3000. |
| **lint** | `npm run lint` | Runs ESLint 9 to detect syntax, type, and code-style irregularities. |
| **test** | `npm test` | Runs the full Vitest automated test suite once. |
| **test:watch** | `npm run test:watch` | Launches Vitest in interactive watch mode for test-driven development (TDD). |

---

## Security & Networking Architecture

### Next.js Reverse Proxy & Rewrite Pipeline

To prevent cross-origin resource sharing (CORS) preflight issues and browser-level blocking, `next.config.ts` exposes a built-in reverse proxy rewrite:

```
+------------------------+
| Client Browser         |
| http://localhost:3000  |
+------------------------+
            |
            | 1) Direct call or internal fetch: /api/v1/products
            v
+------------------------+
| Next.js App Router     |
| (Rewrites Pipeline)    |
+------------------------+
            |
            | 2) Reverse proxy forward (Server-to-Server)
            v
+------------------------+
| GASH Backend (v2)      |
| http://localhost:5000  |
+------------------------+
```

```typescript
// next.config.ts
async rewrites() {
  const rawBackendUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api/v1';

  const backendRoot = rawBackendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

  return [
    {
      source: '/api/v1/:path*',
      destination: `${backendRoot}/api/v1/:path*`,
    },
  ];
}
```

---

### Resilient API Client with Dual-Token Rotation Interceptor

The application integrates an enterprise-grade HTTP communication layer in `src/lib/apiClient.ts` that coordinates with the backend's dual-token security architecture:

```
+---------------+                                                      +------------------+
|  apiClient    | --- (1) Protected Request (Bearer AccessToken) ----> | GASH Backend v2  |
|               | <--- (2) HTTP 401 Unauthorized (Token Expired) ----- |                  |
+---------------+                                                      +------------------+
        |
        | [INTERCEPTOR ACTIVATED]
        | 1. Checks refreshPromise mutex (prevents concurrent refreshes)
        | 2. Retrieves refreshToken from useAuthStore
        v
+---------------+
|  authService  | --- (3) POST /api/v1/auth/refresh-token -----------> | GASH Backend v2  |
| .refreshToken | <--- (4) 200 OK (New Access + New Refresh Token) --- |                  |
+---------------+
        |
        | 3. Stores new tokens in useAuthStore (LocalStorage updated)
        | 4. Replaces Authorization header with new AccessToken
        v
+---------------+
|  apiClient    | --- (5) Replays Original Request (Transparently) --> | GASH Backend v2  |
| (Retry Step)  | <--- (6) 200 OK with Target Payload ---------------- |                  |
+---------------+
```

1. **401 Token Refresh Mutex**: If an access token expires mid-session, all queued requests wait on a single `refreshPromise`. Once refreshed, all pending requests replay automatically.
2. **Automatic Retry for GET Requests**: If a transient network glitch or `5xx` error occurs during an idempotent `GET` query, `apiClient` automatically performs exponential backoff retries.
3. **Timeout Protection**: Standard requests abort cleanly after 15 seconds via native `AbortController`.

---

### Content Security Policy & Hardened Security Headers

Security headers are enforced at the edge via `next.config.ts`:

- **HSTS (HTTP Strict Transport Security)**: `max-age=63072000; includeSubDomains; preload`
- **X-Frame-Options**: `SAMEORIGIN` (mitigates clickjacking)
- **X-Content-Type-Options**: `nosniff` (prevents MIME sniffing)
- **Referrer-Policy**: `origin-when-cross-origin`
- **Permissions-Policy**: Restricts camera, microphone, and geolocation
- **Content-Security-Policy (CSP)**: Strictly controls script, image, connect, font, and frame origins.

---

### XSS Sanitization Engine

All rich text descriptions, review summaries, and promotional content are processed through `isomorphic-dompurify` prior to DOM insertion, preventing malicious script injection while preserving safe styling tags.

---

## State Management & Data Architecture

```
                                  +------------------------------+
                                  |     GASH Frontend State      |
                                  +------------------------------+
                                                 |
                   +-----------------------------+-----------------------------+
                   |                                                           |
                   v                                                           v
       +-----------------------+                                   +-----------------------+
       |   Client-Side State   |                                   |   Server-Side State   |
       |       (Zustand)       |                                   |  (TanStack Query/SSR) |
       +-----------------------+                                   +-----------------------+
       | - useCartStore        |                                   | - fetchProducts       |
       |   * items, totals     |                                   | - fetchProductByHandle|
       |   * LocalStorage sync |                                   | - fetchFeatured       |
       | - useAuthStore        |                                   | - React 19 cache()    |
       |   * user, tokens      |                                   | - Query caching (5m)  |
       |   * LocalStorage sync |                                   +-----------------------+
       | - useToastStore       |
       |   * notification queue|
       +-----------------------+
```

### Client State Architecture (Zustand)

Client state is distributed across focused Zustand stores:

- **`useCartStore`**:
  - Manages shopping cart items, selected options (size, color), unit prices, and quantities.
  - Computes `getTotalItems()` and `getTotalPrice()` dynamically.
  - Automatically synchronizes to browser `localStorage` under `jocksport-cart-storage`.
- **`useAuthStore`**:
  - Stores authenticated `UserProfile` and dual JWT tokens (`accessToken`, `refreshToken`).
  - Provides `setTokens`, `setUser`, and `clearAuth` actions.
  - Persists across page reloads via `jocksport-auth-storage`.
- **`useToastStore`**:
  - Dispatches non-blocking notifications (`success`, `error`, `info`, `warning`) with auto-dismiss timers.

---

### Server State & Caching Pipeline

- **Server-Side Rendering (SSR)**: Dynamic product detail pages (`/products/[slug]`) and collection listings (`/collections/[slug]`) fetch data on the server with React 19 `cache()` to eliminate redundant round trips.
- **TanStack React Query**: Wrapped in `ReactQueryProvider.tsx`, manages client-side caching (`staleTime: 5 min`, `gcTime: 10 min`), preventing repetitive requests when filtering and toggling categories.

---

### Cart Synchronization & Guest-to-User Merge Flow

The storefront supports seamless guest shopping with automated cart merging upon sign-in:

```
[Guest Visitor]
      |
      | 1) Adds items locally (saved in useCartStore / LocalStorage)
      v
[User Logs In]
      |
      | 2) authService.login() succeeds
      v
[Cart Merge Step]
      |
      | 3) cartApiService.mergeCart(localItems) -> POST /api/v1/cart/merge
      v
[Synchronized State]
      |
      | 4) Local cart is synchronized with server cart from MongoDB
      v
[Seamless Checkout]
```

---

### Global Toast Notification System

Floating notifications are mounted at the root application layout via `ToastContainer.tsx`. Components trigger alerts from anywhere in the component tree without prop-drilling:

```typescript
import { useToastStore } from '@/store/useToastStore';

const showToast = useToastStore((state) => state.showToast);
showToast('Item successfully added to your cart!', 'success');
```

---

## Component & Design System Architecture

### Global Design Tokens & CSS Variables

Design tokens are declared as CSS custom properties in `src/app/globals.css`:

| Category | CSS Variable | Value / Description |
| :--- | :--- | :--- |
| **Brand Colors** | `--color-navy` | Deep Navy `#0F172A` (primary brand identity) |
| **Accents** | `--color-sale-red` | Vivid Athletic Red `#EF4444` (pricing & discounts) |
| **Neutrals** | `--color-bg-gray` | Soft Gray `#F8FAFC` (card & section backgrounds) |
| **Borders** | `--color-border` | Subtle Gray `#E2E8F0` |
| **Typography** | `--font-geist-sans` | Primary sans-serif typeface |
| **Spacing** | `--space-1` to `--space-16` | Standard 4px-based geometric spacing scale |
| **Radii** | `--radius-sm` to `--radius-full` | Rounded card corners (4px, 8px, 12px, 9999px) |

---

### Layout Component Hierarchy

- **Header (`src/components/layout/Header`)**:
  - `AnnouncementBar`: Top banner for seasonal discounts and shipping announcements.
  - `UspBar`: Highlights core value propositions (Free Shipping, 30-Day Returns, Authentic Gear).
  - `MainNavbar`: Brand logo, category mega menus, search trigger, account button, and interactive cart drawer trigger with dynamic badge count.
- **Footer (`src/components/layout/Footer`)**:
  - Multi-tier layout with newsletter signup, customer support links, brand history, social icons, and copyright notices.

---

### Reusable UI Component Modules

| Component | Path | Description |
| :--- | :--- | :--- |
| `HeroCarousel` | `src/components/ui/HeroCarousel` | Auto-advancing visual banner carousel with custom CTA buttons. |
| `ProductCard` | `src/components/ui/ProductCard` | Standardized product card with sale tags, hover zoom, and quick action. |
| `ProductGallery` | `src/components/ui/ProductGallery` | Multi-image preview with active thumbnail selection and zoom. |
| `ProductInfo` | `src/components/ui/ProductInfo` | Purchase panel with size/color selection, quantity, and Add to Cart trigger. |
| `ProductTabs` | `src/components/ui/ProductTabs` | Tabbed container for product specifications, shipping, and reviews. |
| `FilterSidebar` | `src/components/ui/FilterSidebar` | Faceted filter options (price range, brand, category, size, color). |
| `CollectionControlBar` | `src/components/ui/CollectionControlBar` | Catalog layout switcher (grid/list) and sorting dropdown selector. |
| `CartSidebar` | `src/components/ui/CartSidebar` | Slide-out drawer with live item editing, subtotal calculation, and checkout CTA. |
| `QuantitySelector` | `src/components/ui/QuantitySelector` | Accessible numeric increment/decrement counter button. |
| `EmptyState` | `src/components/ui/EmptyState` | Reusable empty state view with illustration and recovery button. |
| `Toast` / `ToastContainer` | `src/components/ui/Toast` | Floating stack of transient notifications with progress timers. |
| `Skeleton` | `src/components/ui/Skeleton` | Animated pulse placeholder for SSR loading transitions. |

---

### Storefront Pages & Dynamic Routes

| Route | Render Mode | Description |
| :--- | :---: | :--- |
| `/` | SSR / ISR | Storefront homepage with hero carousel, featured categories, and trending gear. |
| `/collections/[slug]` | Dynamic SSR | Dynamic catalog browsing with faceted filters, sorting, and pagination. |
| `/products/[slug]` | Dynamic SSR | Full product detail page with high-res gallery, variant selectors, and reviews. |
| `/cart` | Client Component | Comprehensive cart management with item details, pricing totals, and clear actions. |
| `/checkout` | Client Component | Multi-step checkout with contact form, shipping method, payment selection, and confirmation. |
| `/sitemap.xml` | Server Generated | Dynamic XML sitemap indexing all active products and collections. |
| `/robots.txt` | Server Generated | Search engine indexing rules and sitemap reference. |

---

## Backend Integration & Schema Transformation

### GASH Backend (v2) Contract Alignment

The frontend communicates with `gash-backend-v2` via RESTful JSON endpoints:

| Domain | Frontend Service | Backend Route | Purpose |
| :--- | :--- | :--- | :--- |
| **Products** | `productService.ts` | `GET /api/v1/products` | Fetch catalog with filter query parameters |
| **Product Detail** | `productService.ts` | `GET /api/v1/products/slug/:slug` | Retrieve single product by URL slug |
| **Cart Operations** | `cartService.ts` | `/api/v1/cart/*` | Full cart lifecycle and guest cart merge |
| **Authentication** | `authService.ts` | `/api/v1/auth/*` | Register, login, token refresh, password reset |
| **User Profile** | `userService.ts` | `/api/v1/users/me/*` | Account updates, address books, password change |

---

### Schema Normalization (`mapProductToFrontend`)

The backend schema (MongoDB ObjectIds, snake/camel mixed schemas, subdocument image objects) is transformed into a clean, presentation-ready `FrontendProduct` interface by `mapProductToFrontend()`:

```typescript
// Maps raw backend product documents to frontend models
export function mapProductToFrontend(raw: Record<string, unknown>): FrontendProduct {
  const id = String(raw._id || raw.id || '');
  const title = String(raw.name || raw.title || '');
  const handle = String(raw.slug || raw.handle || id);
  const brand = String(raw.brand || raw.vendor || 'GASH');
  const price = Number(raw.price || 0);
  const compareAtPrice = raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined;
  
  // Extracts primary image and secondary gallery URLs
  const images = extractImageUrls(raw.images);

  return {
    id,
    handle,
    title,
    brand,
    price,
    salePrice: price,
    originalPrice: compareAtPrice,
    imageUrl: images[0] || '/placeholder.jpg',
    images,
    // ...normalized attributes, variants, and specifications
  };
}
```

---

### Resilient Fallback Mode

If the backend service is offline during local UI development or testing, `productService.ts` seamlessly falls back to mock catalog collections, allowing frontend styling and layout validation to proceed without interruption.

---

## Testing & Quality Assurance

Automated testing is configured using [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/) and [JSDOM](https://github.com/jsdom/jsdom).

### Test Suite Highlights

| Test Suite | File | Tests | Coverage Scope |
| :--- | :--- | :---: | :--- |
| **Cart Store** | `src/store/useCartStore.test.ts` | 7 | Adding items, deduplication, quantity changes, removal, subtotal calculation |
| **API Client** | `src/lib/apiClient.test.ts` | 6 | Request headers, timeout aborts, 5xx backoff retries, error normalization |
| **Product Service** | `src/services/productService.test.ts` | 6 | Model mapping, image extraction, fallback behavior, slug resolution |
| **Formatting Helpers** | `src/lib/format.test.ts` | 3 | Currency formatting, discount calculation, string truncation |
| **Breadcrumb UI** | `src/components/ui/Breadcrumb/Breadcrumb.test.tsx` | 2 | Navigation item rendering, active page indicator |
| **ProductCard UI** | `src/components/ui/ProductCard/ProductCard.test.tsx` | 2 | Price formatting, discount badge rendering, link targets |

### Running Tests

```bash
# Execute all test suites once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Production Deployment & Process Management

### Optimized Production Build

To compile and optimize the frontend for production:

```bash
npm run build
```

This generates an optimized `.next` production bundle with server components, prerendered static pages, and minified CSS Modules.

To test the compiled bundle locally:

```bash
npm run start
```

---

### Vercel Deployment (Serverless / Edge)

This application is engineered for zero-configuration deployment to [Vercel](https://vercel.com):

1. Connect your repository to Vercel.
2. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your production backend API URL (e.g. `https://api.yourdomain.com/api/v1`).
   - `INTERNAL_API_URL`: Backend URL accessible from Vercel Serverless functions.
   - `NEXT_PUBLIC_SITE_URL`: Production storefront domain (e.g. `https://store.yourdomain.com`).
3. Deploy. Rewrites, image optimization, and headers will be applied automatically.

---

### Node.js Standalone Runtime & PM2

For self-hosted virtual machines (AWS EC2, DigitalOcean, Linode):

```bash
# 1. Build production bundle
npm run build

# 2. Run with PM2 in cluster mode
pm2 start npm --name "gash-frontend" -- start

# 3. Monitor running instances
pm2 status
pm2 logs gash-frontend
```

---

## License

Private and proprietary. All rights reserved.
