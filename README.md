<p align="center">
  <a href="https://openstrand.ai">
    <img alt="OpenStrand" height="88" src="https://raw.githubusercontent.com/framersai/openstrand-monorepo/master/openstrand-app/public/logos/openstrand-logo.svg">
  </a>
</p>

# OpenStrand App (Next.js)

The OpenStrand App is a TypeScript-first Next.js application that brings the OpenStrand platform to life: knowledge graph exploration, schema intelligence, visualization tiers, team collaboration, and AI-assisted workflows.

---

## ✨ Core Capabilities

- App shell powered by Next.js 14 (App Router) with type-safe APIs
- Internationalization (next-intl) with locale routes under `src/app/[locale]/...`
- Offline-aware mode with PGlite-backed backend and local-first UX
- Tiered visualization system (heuristic → dynamic → AI Artisan)
- Knowledge Graph: nodes/edges exploration, 2D/3D modes, clusters
- AI usage tracking surfaced in the UI (provider cost breakdowns)

---

## 🏗️ Architecture

```
src/
├─ app/                     # App Router pages, route groups, layouts
├─ components/              # UI components (Headless + ShadCN style)
├─ features/                # Feature slices (dashboard, composer, etc.)
├─ services/                # API service layer (OpenStrand API client)
├─ store/                   # Zustand state for knowledge graph and UI
├─ types/                   # Strongly-typed front-end models
├─ styles/                  # SCSS modules and global styles
└─ i18n/                    # next-intl configuration and messages
```

Key design choices:
- Minimal client state. Server data fetched via `services/openstrand.api.ts`.
- Co-located feature components (`features/*`) for discoverability.
- Types shared with backend via generated docs and aligned interfaces.

---

## 🚀 Getting Started

Prerequisites:
- Node.js 18.17+
- Backend running locally at http://localhost:8000 (see Teams Backend README)

Setup:
```bash
npm install
cp .env.example .env
npm run dev
```

Visit http://localhost:3000

Environment variables (App):
- `NEXT_PUBLIC_API_URL` – default `http://localhost:8000/api/v1`
- `NEXT_PUBLIC_OFFLINE_MODE` – `true|false` to hint UI

---

## 🔌 Service Layer

The API client lives in `src/services/openstrand.api.ts`:
- Strong input/output types (`Weave`, `WeaveNode`, `WeaveEdge`, `Strand`, etc.)
- Safe parsing helpers for flexible payloads
- Endpoints for strands, relationships, permissions, knowledge graph

Example:
```ts
import { weaveAPI } from '@/services/openstrand.api';
const graph = await weaveAPI.get({ domain: 'default' });
```

---

## 🧠 Knowledge Graph

State and transforms are in `src/store/knowledge-graph.store.ts`:
- Normalized `nodes`/`edges` maps with selection state
- Derived `clusters`, focus targets, metrics
- Defensive math with optional Z (`z?: number`) handled

---

## 📊 Visualization Tiers

OpenStrand supports three tiers:
1. Heuristic patterns (fast, deterministic)
2. Dynamic visualizations (user input + filters)
3. AI Artisan (code generation for bespoke visuals)

The app exposes a consistent UX across tiers with clear labels and provenance.

---

## 🌍 Internationalization

`next-intl` provides locale routing (`/en/...`, `/fr/...`, etc.).

- Messages in `src/i18n/*`
- Helpers to format dates, numbers, and localized content

---

## 🧪 Quality & DX

Commands:

| Task           | Command                    |
|----------------|----------------------------|
| Dev            | `npm run dev`              |
| Type-check     | `npm run type-check`       |
| Lint           | `npm run lint`             |
| Build          | `npm run build`            |
| Test           | `npm run test`             |

---

## 🔗 Links

- Website: https://openstrand.ai
- Backend: [`../packages/openstrand-teams-backend`](../packages/openstrand-teams-backend)
- SDK: [`../packages/openstrand-sdk`](../packages/openstrand-sdk)
- Socials: X/Twitter [`@openstrandai`](https://twitter.com/openstrandai)
- Contact: team@frame.dev

---

<p align="center">
  <a href="https://frame.dev" title="Frame.dev">
    <img src="https://raw.githubusercontent.com/framersai/openstrand-monorepo/master/openstrand-app/public/logos/frame-dev.svg" alt="Frame.dev" height="28" /><br/>
    <sub>Built by Frame.dev • team@frame.dev</sub>
  </a><br/>
  <sub>Follow us on X/Twitter <a href="https://twitter.com/openstrandai">@openstrandai</a></sub>
</p>


