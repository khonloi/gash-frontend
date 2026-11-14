---
name: storefront-design-system-and-media
description: >-
  Design system, CSS Modules tokens, storefront UI components, static media directory layout, and
  Next.js image/CSP configuration for gash-frontend (JOCKSPORT / GASH). Use when styling UI
  components, adding storefront imagery, updating home sections, or modifying next.config.ts.
---

# Storefront Design System & Media (`gash-frontend`)

Follow these conventions when building or restyling storefront components and managing media assets in `d:\Project\gash-frontend`.

## Design Tokens & Styling (`src/app/globals.css`)

- Primary tokens map directly to semantic brand roles:
  - `--brand-turquoise` (`#00e5c9`) -> `--color-primary` / `--color-on-primary: var(--brand-navy)`
  - `--brand-navy` (`#0c1c30`) -> `--color-secondary` / `--color-surface-inverse`
  - `--brand-royal-blue` (`#003cd6`) -> `--color-accent`
  - `--brand-sale-red` (`#ff3366`) -> `--color-danger`
- Always prefer semantic CSS custom properties (`--color-surface`, `--color-surface-subtle`, `--color-text-primary`, `--color-border-default`, `--space-*`, `--radius-*`, `--shadow-*`) over hardcoded hex values in CSS Modules.

## Home Sections & Media Assets (`public/images/`)

Use local high-resolution assets in `public/images/` rather than external placeholder URLs:
- Heroes (`src/components/ui/HeroCarousel/HeroCarousel.tsx`): `/images/heroes/hero-routine.png`, `/images/heroes/hero-running.png`, `/images/heroes/hero-training.png`
- Promo Banners (`src/app/page.tsx`, `src/components/ui/PromoBanner/PromoBanner.tsx`): `/images/promos/promo-swimming.png`, `/images/promos/promo-football-kits.png`
- Category Circles (`src/components/home/CategorySection.tsx`): `/images/climbing.png`, `/images/football.png`, `/images/running.png`, `/images/swimming.png`, `/images/training.png`
- Sport Cards (`src/components/home/SportsSection.tsx`, `src/components/ui/SportCard/SportCard.tsx`): `/images/sports/sport-*.png` mapped via `SPORT_IMAGES` with `DynamicSportsSection` prioritizing sport disciplines and backfilling from `DEFAULT_SPORTS` up to 6 unique cards.

## Image Optimization & Security Headers (`next.config.ts`)

- `next/image` is configured for `image/avif` and `image/webp` formats; remote product images come from Shopify CDN (`cdn.shopify.com`), Cloudinary (`res.cloudinary.com`), and Unsplash hosts explicitly whitelisted in both `images.remotePatterns` and the CSP `img-src` directive.
- In non-production builds, CSP `connect-src` explicitly allows localhost / `127.0.0.1` HTTP and `ws://` origins for REST + Socket.IO connectivity.
- Always run `pnpm run typecheck && pnpm run lint && pnpm test -- --run` after component or config changes.

