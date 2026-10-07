/* Admin page registry — add a page here to get its route and sidebar entry. */
import AdminOverview from "./AdminOverview";
import Clients from "./Clients";
import UploadCenter from "./UploadCenter";
import Requests from "./Requests";
import Inbox from "./Inbox";
import AdminDeployments from "./AdminDeployments";
import Users from "./Users";

export const ADMIN_PAGES = [
  { path: "", label: "Overview", icon: "home", Component: AdminOverview },
  { path: "clients", label: "Clients", icon: "users", Component: Clients },
  { path: "upload", label: "Upload center", icon: "upload", Component: UploadCenter },
  { path: "requests", label: "Requests", icon: "send", Component: Requests, badge: "requests" },
  { path: "messages", label: "Messages", icon: "chat", Component: Inbox, badge: "messages" },
  { path: "deployments", label: "Deployments", icon: "rocket", Component: AdminDeployments },
  { path: "users", label: "Users & access", icon: "gear", Component: Users },
];

export const adminTo = (path) => (path ? `/admin/${path}` : "/admin");
