# InboundPlus Client Hub

Client portal for [InboundPlus](https://inboundplus.agency), built by Synchronous Consulting.
It is a **React 18 + Vite** app with React Router, **Supabase Auth**, Three.js (3D charts) and Chart.js, hosted on **Vercel**.

- **Public content** (plans and prices, methodology, testimonials, client logos, blog and ebooks, contact) comes from inboundplus.agency.
- **Portal dashboards** use fictional sample data (client "Andes Outdoor Co.") and are labelled "Sample data".

## Quick start
```bash
npm install
npm run dev        # http://localhost:5510
npm run build      # production build in dist/
```

## Project structure
```
src/
  main.jsx                 entry: Router + Auth + Dynamic Island providers
  App.jsx                  routes: /, /login, /portal/*
  pages/
    Home.jsx               public site
    Login.jsx              log in / register / reset password / demo
    portal/
      registry.js          ← list of portal pages (routes + sidebar + search)
      Overview.jsx … Settings.jsx   one file per portal section (16)
  layouts/PortalLayout.jsx sidebar, top bar, search, notifications, user menu
  components/
    ui.jsx                 Tilt, Kpi, Panel, Modal, Segmented, Chips, SortableTable, BarScene (3D)…
    Icon.jsx               stroke icon set
    RequestModal.jsx       shared "new request" dialog
  context/
    AuthContext.jsx        Supabase auth, with local demo fallback
    IslandContext.jsx      Dynamic Island notifications: useIsland().notify(...)
    PortalContext.jsx      portal working state (tasks, files, messages…) persisted locally
  lib/                     supabase client, chart defaults, 3D bar scene, utils
  data/index.js            public content + sample portal data
  styles/global.css        design tokens (brand colours) and all styles
public/img/                logo, partner badges, client logos
```

## Add a new portal page
1. Create `src/pages/portal/MyPage.jsx`.
2. Add one line to `src/pages/portal/registry.js`:
   `{ path: "my-page", label: "My page", icon: "chart", group: "Insights", Component: MyPage }`

The route, sidebar item, page title and search entry are all created from that line.

## Moving from sample data to real data
- Portal state lives in `context/PortalContext.jsx` and is stored in localStorage. Replace it with Supabase tables (organisations, projects, files, reports), protected by RLS per client.
- Dashboard numbers come from `data/index.js`. Replace them with API calls to GA4, Search Console, Shopify, HubSpot and Meta/Google Ads, ideally through Vercel serverless functions.
- AI agent replies are scripted in `pages/portal/Agents.jsx` (`reply()`). Point it at a serverless function that calls the Claude API.

## Supabase
- Env vars are in `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable key, which is safe to expose). Set `VITE_ALLOW_DEMO=false` to hide the demo account.
- Go to **Authentication → URL Configuration**:
  - Site URL: `https://inboundplus.vercel.app`
  - Redirect URLs: `https://inboundplus.vercel.app/**`
- Optional: run `supabase/schema.sql` to store client profiles. The `profiles` table is protected by RLS and filled automatically on sign-up.

## Vercel
`vercel.json` already sets framework **Vite**, build command `npm run build`, output directory `dist`, SPA rewrites and security headers. Pushing to `main` deploys automatically.
