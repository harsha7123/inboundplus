# InboundPlus Client Hub — demo prototype

Clickable front-end demo of a client portal for InboundPlus, prepared by Synchronous Consulting.
All clients, people and numbers are fictional sample data. No backend; nothing is sent anywhere.

## Run
```
python -m http.server 5510
```
Then open http://localhost:5510 (or just double-click `index.html`; needs internet for fonts, Three.js and Chart.js CDNs).

## Pages
- `index.html` — public site: 3D hero, services, software catalogue, portal features, blog
- `login.html` — log in / register (stored only in browser localStorage), "Explore the demo client account"
- `portal.html` — client portal (16 sections):
  Dashboard (3D revenue-by-channel), Analytics (funnel, cohorts, date range), E-commerce (3D products, CRO tests),
  SEO (live audit, keyword table), Paid ads (budget simulator), Projects (drag-and-drop board, requests),
  Deployments (live pipeline simulation), AI agents (chat with agents), Software catalogue, Reports (custom builder, PDF),
  Surveys (live results), Blog, Files & approvals (upload, approve), Messages, Billing, Settings (integrations, team)

To reset the demo, clear the site's localStorage (keys start with `ip_`).

## Next step to production
Replace `assets/js/data.js` with API calls (GA4, Search Console, Shopify, HubSpot, Meta/Google Ads),
add real auth (httpOnly sessions, MFA) and multi-tenant orgs. See SupplyForge2 review for reusable parts.
