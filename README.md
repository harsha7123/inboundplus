# InboundPlus Client Hub

Client portal prototype for [InboundPlus](https://inboundplus.agency), built by Synchronous Consulting.
Static site (HTML/CSS/JS, no build step), hosted on **Vercel**, logins via **Supabase Auth**.

- **Public content** (services and prices, methodology, testimonials, client logos, blog and ebooks, contact) comes from inboundplus.agency.
- **Portal dashboards** use fictional sample data (client "Andes Outdoor Co.") and are labelled "Sample data".
- The "AI & software solutions" section lists solutions proposed with Synchronous Consulting. Pricing is quoted on request.

## Pages
| File | What |
|---|---|
| `index.html` | Public site: 3D hero, service plans, methodology, AI & software, success stories, blog/ebooks, contact |
| `login.html` | Log in, register, forgot/reset password, demo account |
| `portal.html` | Client portal with 16 sections: Dashboard, Analytics, E-commerce, SEO, Paid ads, Projects, Deployments, AI agents, Software, Reports, Surveys, Blog, Files, Messages, Billing, Settings |

## 1. Supabase setup
1. Create a project at supabase.com.
2. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key into `assets/js/config.js`.
3. Go to **Authentication → URL Configuration**:
   - Site URL: `https://<your-vercel-domain>`
   - Redirect URLs: `https://<your-vercel-domain>/portal.html` and `https://<your-vercel-domain>/login.html?mode=reset`
4. Optional: run `supabase/schema.sql` in the SQL Editor. It creates a `profiles` table, protected by RLS, that is filled automatically on sign-up.
5. Optional: set `ALLOW_DEMO: false` in `config.js` to hide the demo-account button.

If `config.js` is left empty, the site runs in **demo mode**: accounts are stored only in the browser.

## 2. Deploy to Vercel
- Import the GitHub repo into Vercel. Framework preset: **Other**. No build command. Output directory: `./`.
- Or use the CLI: `npx vercel --prod` from this folder.

## Run locally
```
python -m http.server 5510
```
Then open http://localhost:5510.

## Next steps to production
- Replace `assets/js/data.js` with API calls to GA4, Search Console, Shopify, HubSpot and Meta/Google Ads.
- Add Supabase tables (organisations, projects, reports, files) with RLS per client.
