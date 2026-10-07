/* Agency-side reference data: onboarding process and AI agent catalogue. */

/** Client lifecycle stages shown on the onboarding board. */
export const STAGES = ["Signed", "Kickoff", "Access & assets", "Setup", "Launch", "Live"];

/** Default onboarding checklist created for every new client (section = stage it belongs to). */
export const ONBOARDING_TEMPLATE = [
  ["Kickoff", "Welcome email sent and client portal access created"],
  ["Kickoff", "Account manager assigned"],
  ["Kickoff", "Kickoff call held — goals, KPIs and budget agreed"],
  ["Kickoff", "Onboarding questionnaire completed"],
  ["Access & assets", "Store admin access (Shopify / WooCommerce / VTEX)"],
  ["Access & assets", "Google Analytics 4 and Tag Manager access"],
  ["Access & assets", "Google Search Console access"],
  ["Access & assets", "Google Ads access (client keeps ownership)"],
  ["Access & assets", "Meta Business Manager partner access"],
  ["Access & assets", "HubSpot / CRM connected"],
  ["Access & assets", "Brand guidelines, logos and product photos received"],
  ["Setup", "Tracking audit — pixels, conversions and UTMs verified"],
  ["Setup", "Growth diagnosis completed (bottlenecks, funnel, KPIs)"],
  ["Setup", "90-day action plan approved by client"],
  ["Setup", "Portal dashboards connected to live data"],
  ["Launch", "First campaigns live"],
  ["Launch", "AI agents configured and tested"],
  ["Launch", "First monthly report scheduled"],
  ["Launch", "30-day review meeting booked"],
];

/** Monthly value of each InboundPlus package (Partner = USD 60,000 over 6 months). */
export const PLAN_MRR = { "Ecommerce Growth Blueprint": 0, "Ecommerce Growth Advisory": 3000, "Commerce Growth Partner": 10000 };
export const PLAN_ONE_TIME = { "Ecommerce Growth Blueprint": 2000 };

export const AGENT_STATUSES = ["Setup", "Testing", "Live", "Paused"];

/** The 20 AI agents from the "AI Agent Opportunities for InboundPlus" proposal. */
export const AGENT_CATALOG = [
  { key: "customer-service", name: "AI Customer Service Agent", group: "Client stores", icon: "chat", summary: "Answers shoppers 24/7 on WhatsApp, web chat and Instagram in Spanish and English.", channel: "WhatsApp + Web chat" },
  { key: "cart-recovery", name: "Abandoned Cart Recovery Agent", group: "Client stores", icon: "cart", summary: "Follows up abandoned carts by WhatsApp or email and brings shoppers back to checkout.", channel: "WhatsApp + Email" },
  { key: "shopping-assistant", name: "Shopping Assistant & Recommender", group: "Client stores", icon: "star", summary: "Guides shoppers to the right products, bundles and add-ons.", channel: "Website" },
  { key: "catalog-seo", name: "Product Content & Catalogue SEO", group: "Client stores", icon: "search", summary: "Writes product titles, descriptions and meta tags at scale in the brand voice.", channel: "Store CMS" },
  { key: "reviews", name: "Review & Reputation Agent", group: "Client stores", icon: "star", summary: "Drafts review replies, flags complaints and summarises customer feedback.", channel: "Google + store reviews" },
  { key: "retention", name: "Post-Purchase & Retention Agent", group: "Client stores", icon: "users", summary: "Replenishment reminders, personalised offers and win-back journeys.", channel: "Email + WhatsApp" },
  { key: "lead-qualification", name: "Lead Qualification Agent", group: "Client stores", icon: "target", summary: "Qualifies leads in seconds and books meetings for high-ticket sales.", channel: "Lead forms + WhatsApp" },
  { key: "ad-copy", name: "Ad Copy & Creative Variants", group: "InboundPlus delivery", icon: "ads", summary: "Generates on-brand ad variants for Meta, Google and TikTok.", channel: "Ad platforms" },
  { key: "campaign-analyst", name: "Campaign Performance Analyst", group: "InboundPlus delivery", icon: "chart", summary: "Daily checks of ad accounts; flags waste and suggests budget moves.", channel: "Ad platforms + GA4" },
  { key: "cro-audit", name: "Funnel & CRO Audit Agent", group: "InboundPlus delivery", icon: "zap", summary: "Finds funnel drop-offs and drafts prioritised fixes for the Growth Blueprint.", channel: "GA4 + site crawl" },
  { key: "seo-content", name: "SEO Content & Blog Agent", group: "InboundPlus delivery", icon: "blog", summary: "Keyword research, briefs and first drafts in Spanish and English.", channel: "CMS" },
  { key: "tech-seo", name: "Technical SEO Monitor", group: "InboundPlus delivery", icon: "globe", summary: "Weekly crawls and plain-language reports of technical SEO issues.", channel: "Search Console" },
  { key: "competitor-intel", name: "Competitor & Market Intelligence", group: "InboundPlus delivery", icon: "eye", summary: "Monthly brief on competitor prices, promotions and ads.", channel: "Web + ad libraries" },
  { key: "exec-reporting", name: "Executive Reporting Agent", group: "InboundPlus delivery", icon: "report", summary: "Writes monthly and quarterly reports from live data.", channel: "Client portal" },
  { key: "forecast", name: "Sales Scenarios & Forecast (AI Growth OS)", group: "InboundPlus delivery", icon: "chart", summary: "What-if sales scenarios and forecasts for budget decisions.", channel: "Client portal" },
  { key: "growth-evaluation", name: "Free AI Growth Evaluation", group: "InboundPlus growth", icon: "target", summary: "Instant AI diagnosis for prospects on inboundplus.agency.", channel: "Website" },
  { key: "proposal-onboarding", name: "Proposal & Onboarding Agent", group: "InboundPlus growth", icon: "folder", summary: "Drafts proposals and runs new-client onboarding.", channel: "HubSpot + portal" },
  { key: "crm-assistant", name: "HubSpot CRM Assistant", group: "InboundPlus growth", icon: "plug", summary: "Keeps HubSpot clean, scores and routes leads.", channel: "HubSpot" },
  { key: "portal-assistant", name: "Client Portal Assistant", group: "InboundPlus growth", icon: "bot", summary: "Answers client questions using their own portal data.", channel: "Client portal" },
  { key: "team-copilot", name: "Team Knowledge Copilot (Claude Skills)", group: "InboundPlus growth", icon: "code", summary: "Claude skills that capture InboundPlus methods and templates.", channel: "Claude" },
];
export const agentByKey = (k) => AGENT_CATALOG.find((a) => a.key === k);
