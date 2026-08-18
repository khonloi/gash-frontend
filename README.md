# JOCKSPORTS Frontend

JOCKSPORTS is a high-performance e-commerce web application built for athletic footwear, apparel, and sports gear. The application delivers a modern, responsive shopping experience with product exploration, collection filtering, product detail views, and cart management.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Available Scripts](#available-scripts)
- [Component Structure](#component-structure)
- [State Management](#state-management)
- [Styling & Design System](#styling--design-system)
- [Linting and Code Quality](#linting-and-code-quality)
- [License](#license)

---

## Overview

The `jocksport-fe` repository houses the customer-facing frontend interface for JOCKSPORTS. Built on Next.js with React Server and Client Components, it is engineered for optimal performance, accessibility, search engine optimization (SEO), and maintainable UI architecture using scoped CSS Modules.

---

## Key Features

- **Storefront & Discovery**: Interactive hero carousel, category navigation, curated brand showcases, and featured sports gear collections.
- **Collection & Catalog Browsing**: Dynamic collection routing (`/collections/[slug]`) with multi-faceted filtering (category, brand, size, price, color) and sorting controls.
- **Product Detail Experience**: Dynamic product pages (`/products/[slug]`) with high-resolution image galleries, variant selection (size, color), detailed specification tabs, customer reviews, and related products.
- **Cart & State Management**: Real-time client-side cart operations and UI state tracking powered by Zustand.
- **Content & Journal**: Athletic journal and fitness editorial integration with category filtering.
- **Responsive & Accessible Layout**: Mobile-first responsive design featuring top announcement bars, USP highlights, desktop/mobile navigation, and multi-tier footers.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19 / React DOM 19
- **Language**: TypeScript
- **Styling**: Vanilla CSS & Scoped CSS Modules with custom design tokens
- **Icons**: Lucide React
- **Client State Management**: Zustand
- **Server State & Data Fetching**: TanStack React Query
- **Typography**: Next.js Font Optimization (`Geist` and `Geist Mono`)
- **Linting**: ESLint with Next.js configuration

---

## Project Architecture

```
jocksport-fe/
├── public/                     # Static assets, images, and brand media
├── src/
│   ├── app/                    # Next.js App Router (pages, layouts, globals)
│   │   ├── collections/[slug]/ # Dynamic collection and catalog pages
│   │   ├── products/[slug]/    # Dynamic product detail pages
│   │   ├── globals.css         # Global design tokens and reset styles
│   │   ├── layout.tsx          # Root application layout
│   │   └── page.tsx            # Home storefront page
│   ├── components/
│   │   ├── layout/             # Layout components (Header, Footer, Navbar)
│   │   ├── providers/          # Context and Query providers
│   │   └── ui/                 # Reusable UI component modules
│   ├── constants/              # Shared application constants
│   ├── features/               # Domain-specific feature modules
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Helper utilities and data sources
│   ├── services/               # API service integration layer
│   ├── store/                  # Zustand global state stores
│   └── types/                  # TypeScript interface and type declarations
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js build and runtime configuration
├── package.json                # Project dependencies and scripts
└── tsconfig.json               # TypeScript compiler configuration
```

---

## Getting Started

### Prerequisites

Ensure the following runtimes and package managers are installed:

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher (or `pnpm` / `yarn`)

### Installation

Clone the repository and install the project dependencies:

```bash
git clone <repository-url>
cd jocksport-fe
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

The application will be accessible at:
[http://localhost:3000](http://localhost:3000)

### Production Build

Create an optimized production build:

```bash
npm run build
```

Run the production server locally:

```bash
npm run start
```

---

## Available Scripts

The following commands are defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Next.js development server with hot reload |
| `npm run build` | Compiles and optimizes the application for production deployment |
| `npm run start` | Boots the compiled production server |
| `npm run lint` | Executes ESLint to check for syntax and code formatting issues |

---

## Component Structure

Components are organized according to responsibility:

- **Layout (`src/components/layout`)**:
  - `Header`: Composed of `AnnouncementBar`, `UspBar`, and `MainNavbar` with search, mega menus, and user actions.
  - `Footer`: Multi-tier layout including newsletter subscription, brand information, category links, and legal notices.
- **UI Modules (`src/components/ui`)**:
  - `HeroCarousel`: Interactive hero banner with slide transitions.
  - `ProductCard`: Standardized product card with badges, rating, pricing, and action triggers.
  - `FilterSidebar`: Multi-criteria filter options for catalog pages.
  - `CollectionControlBar`: Display controls and sort selector for collections.
  - `ProductGallery`: Thumbnail selection and main view gallery.
  - `ProductInfo`: Purchase controls, size and color selectors, inventory notices.
  - `ProductTabs`: Tabbed interface for specifications, reviews, and delivery details.
  - `ArticleCard`, `BrandCollectionCard`, `SportCard`, `PromoBanner`: Contextual marketing and content components.

---

## State Management

- **Client State**: Lightweight global client state (e.g. shopping cart item tracking, quantity changes) is managed through **Zustand** stores located in `src/store/`.
- **Server State**: Remote data synchronization, caching, and background refetching are handled via **TanStack React Query** wrapped in `src/components/providers/ReactQueryProvider.tsx`.

---

## Styling & Design System

The application uses CSS Modules paired with global CSS variables defined in `src/app/globals.css`.

- **Design Tokens**: Standardized CSS variables for brand colors, background hues, typography scales, container dimensions, transitions, and border radii.
- **Modularity**: Scoped CSS modules (`*.module.css`) ensure isolated styling without global class collisions.
- **Dark & Light Accents**: High-contrast athletic palette using deep dark tones, vibrant accents, and clean neutral backgrounds.

---

## Linting and Code Quality

To ensure consistent code style and identify syntax errors across the repository, run:

```bash
npm run lint
```

Configuration is defined in `eslint.config.mjs` using Next.js and TypeScript recommended presets.

---

## License

Private and proprietary. All rights reserved.
