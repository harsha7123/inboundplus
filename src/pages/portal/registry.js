/* Portal page registry — the single place to add a new portal section.
   1. Create the page component in this folder.
   2. Add one entry below (group controls where it appears in the sidebar).
   Routes, sidebar menu, page titles and global search all read from this list. */

import { lazy } from "react";

const Overview = lazy(() => import("./Overview"));
const Analytics = lazy(() => import("./Analytics"));
const Ecommerce = lazy(() => import("./Ecommerce"));
const Seo = lazy(() => import("./Seo"));
const Ads = lazy(() => import("./Ads"));
const Projects = lazy(() => import("./Projects"));
const Deployments = lazy(() => import("./Deployments"));
const Agents = lazy(() => import("./Agents"));
const Software = lazy(() => import("./Software"));
const Reports = lazy(() => import("./Reports"));
const Surveys = lazy(() => import("./Surveys"));
const Blog = lazy(() => import("./Blog"));
const Files = lazy(() => import("./Files"));
const Messages = lazy(() => import("./Messages"));
const Billing = lazy(() => import("./Billing"));
const Settings = lazy(() => import("./Settings"));

export const PORTAL_PAGES = [
  { path: "", label: "Dashboard", icon: "home", group: "Overview", Component: Overview },
  { path: "analytics", label: "Analytics", icon: "chart", group: "Overview", Component: Analytics },
  { path: "ecommerce", label: "E-commerce", icon: "cart", group: "Overview", Component: Ecommerce },
  { path: "seo", label: "SEO", icon: "search", group: "Overview", Component: Seo },
  { path: "ads", label: "Paid ads", icon: "ads", group: "Overview", Component: Ads },
  { path: "projects", label: "Projects", icon: "folder", group: "Delivery", Component: Projects },
  { path: "deployments", label: "Deployments", icon: "rocket", group: "Delivery", Component: Deployments },
  { path: "agents", label: "AI agents", icon: "bot", group: "Delivery", Component: Agents },
  { path: "software", label: "Software", icon: "code", group: "Delivery", Component: Software },
  { path: "reports", label: "Reports", icon: "report", group: "Insights", Component: Reports },
  { path: "surveys", label: "Surveys", icon: "survey", group: "Insights", Component: Surveys },
  { path: "blog", label: "Blog", icon: "blog", group: "Insights", Component: Blog },
  { path: "files", label: "Files & approvals", icon: "file", group: "Workspace", Component: Files, badge: "approvals" },
  { path: "messages", label: "Messages", icon: "chat", group: "Workspace", Component: Messages, badge: "unread" },
  { path: "billing", label: "Billing", icon: "card", group: "Workspace", Component: Billing },
  { path: "settings", label: "Settings", icon: "gear", group: "Workspace", Component: Settings },
];

export const GROUPS = ["Overview", "Delivery", "Insights", "Workspace"];
export const to = (path) => (path ? `/portal/${path}` : "/portal");
