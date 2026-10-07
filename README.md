# InboundPlus Client Hub

Client portal for [InboundPlus](https://inboundplus.agency), built by Synchronous Consulting.
It is a **React 18 + Vite** app with React Router, **Supabase Auth**, Three.js (3D charts) and Chart.js, hosted on **Vercel**.

- **Public content** (plans and prices, methodology, testimonials, client logos, blog and ebooks, contact) comes from inboundplus.agency.
- **Portal dashboards** use fictional sample data (client "Andes Outdoor Co.") and are labelled "Sample data".

## Two portals
| URL | Who | What |
|---|---|---|
| `/portal` | InboundPlus **clients** | Dashboards, files & approvals, reports, projects, deployments, AI agents, messages, billing |
| `/admin` | InboundPlus **team** (admins) | Agency command center (MRR, client health, attention list), onboarding pipeline + checklists, client portfolio, AI agent catalogue and deployments, requests, messages, upload center, deployments, users & access |

Anything an admin publishes (files, reports, projects, releases, messages) appears immediately in that client's portal. Anything a client does (approvals, uploads, requests, messages) appears in the admin portal.

**Demo:** on `/login`, use **Client demo** or **Admin demo**. Both run on sample data stored in your browser, so no setup is needed.

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
  pages/admin/              admin portal: registry.js, sections.jsx (reusable managers), one file per page
  layouts/AdminLayout.jsx   admin sidebar + top bar
  lib/db.js                 data layer: Supabase adapter + local demo adapter (same API)
  lib/useData.js            hooks: useTable, useOrgs, useUsers, useDb
  components/shared.jsx     FileGrid, Uploader, DownloadButton, ChatThread, DeployTimeline
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
- Files, reports, projects, deployments, requests and messages are already real Supabase data (`lib/db.js`).
- The task board, AI agent toggles, survey and settings toggles still use local state (`context/PortalContext.jsx`). Move them to tables the same way.
- Dashboard numbers come from `data/index.js`. Replace them with API calls to GA4, Search Console, Shopify, HubSpot and Meta/Google Ads, ideally through Vercel serverless functions.
- AI agent replies are scripted in `pages/portal/Agents.jsx` (`reply()`). Point it at a serverless function that calls the Claude API.

## Supabase setup (required for real accounts)
1. Open Supabase → **SQL Editor**, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. Then do the same with [`supabase/002_agency_admin.sql`](supabase/002_agency_admin.sql), which adds onboarding, AI agent and client revenue fields. Both are safe to run again.
2. Register your own account on `/login`, then make yourself an admin by running this in the SQL Editor:
   ```sql
   update public.profiles set role = 'admin', org_id = null where email = 'you@company.com';
   ```
3. Log out and log back in. You will land on `/admin`.
4. Clients who register get their own workspace automatically. To add a teammate to an existing client, ask them to register, then pick their client under **Admin → Users & access**.

Security: Row Level Security makes sure clients can only read their own organization's rows and files, while admins can read and write everything. Clients can only upload files, approve files, send requests and send messages for their own organization.

### Admin features explained
- **Client health score (0-100):** points are deducted for approvals waiting more than 3 days, requests open more than 5 days, client messages without a reply, no team contact for 14 days, onboarding stuck for more than 30 days, and paused accounts. Bands: Healthy ≥ 75, Watch 50-74, At risk < 50 (`src/lib/health.js`).
- **Onboarding:** six stages (Signed → Kickoff → Access & assets → Setup → Launch → Live) with a 19-step checklist covering store, GA4, Search Console, Google Ads, Meta Business Manager, HubSpot, brand assets, tracking audit, 90-day plan and launch (`src/data/agency.js`). The client sees their open steps on their dashboard.
- **AI agents:** the 20-agent catalogue from the proposal. Deploy any agent to a client and track it through Setup → Testing → Live → Paused. Clients see their agents in the portal.
- **MRR:** taken from the package (Advisory USD 3,000/month, Partner USD 60,000 / 6 months = 10,000/month, Blueprint one-time). It can be edited per client.

## Supabase settings
- Env vars are in `.env`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the publishable key, which is safe to expose). Set `VITE_ALLOW_DEMO=false` to hide the demo account.
- Go to **Authentication → URL Configuration**:
  - Site URL: `https://inboundplus.vercel.app`
  - Redirect URLs: `https://inboundplus.vercel.app/**`
- Optional: run `supabase/schema.sql` to store client profiles. The `profiles` table is protected by RLS and filled automatically on sign-up.

## Vercel
`vercel.json` already sets framework **Vite**, build command `npm run build`, output directory `dist`, SPA rewrites and security headers. Pushing to `main` deploys automatically.
