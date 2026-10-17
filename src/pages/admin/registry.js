/* Admin page registry — add a page here to get its route and sidebar entry. */
import { lazy } from "react";

const AdminOverview = lazy(() => import("./AdminOverview"));
const Onboarding = lazy(() => import("./Onboarding"));
const Clients = lazy(() => import("./Clients"));
const Agents = lazy(() => import("./Agents"));
const Payments = lazy(() => import("./Payments"));
const UploadCenter = lazy(() => import("./UploadCenter"));
const Requests = lazy(() => import("./Requests"));
const Inbox = lazy(() => import("./Inbox"));
const AdminDeployments = lazy(() => import("./AdminDeployments"));
const Users = lazy(() => import("./Users"));

export const ADMIN_PAGES = [
  { path: "", label: "Command center", icon: "home", group: "Agency", Component: AdminOverview },
  { path: "onboarding", label: "Onboarding", icon: "survey", group: "Agency", Component: Onboarding, badge: "onboarding" },
  { path: "clients", label: "Clients", icon: "users", group: "Agency", Component: Clients },
  { path: "agents", label: "AI agents", icon: "bot", group: "Agency", Component: Agents },
  { path: "payments", label: "Billing & payments", icon: "card", group: "Agency", Component: Payments },
  { path: "requests", label: "Requests", icon: "send", group: "Delivery", Component: Requests, badge: "requests" },
  { path: "messages", label: "Messages", icon: "chat", group: "Delivery", Component: Inbox, badge: "messages" },
  { path: "upload", label: "Upload center", icon: "upload", group: "Delivery", Component: UploadCenter },
  { path: "deployments", label: "Deployments", icon: "rocket", group: "Delivery", Component: AdminDeployments },
  { path: "users", label: "Users & access", icon: "gear", group: "Settings", Component: Users },
];
export const ADMIN_GROUPS = ["Agency", "Delivery", "Settings"];

export const adminTo = (path) => (path ? `/admin/${path}` : "/admin");
