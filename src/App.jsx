import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PortalProvider } from "./context/PortalContext";
import Home from "./pages/Home";
import { PageLoader } from "./components/ui";
import { ADMIN_PAGES } from "./pages/admin/registry";
import { PORTAL_PAGES } from "./pages/portal/registry";

// Everything except the home page is downloaded only when it's first opened (faster first load).
const Login = lazy(() => import("./pages/Login"));
const Privacy = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import("./pages/Legal").then((m) => ({ default: m.Terms })));
const PortalLayout = lazy(() => import("./layouts/PortalLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const ClientDetail = lazy(() => import("./pages/admin/ClientDetail"));


function RequireAuth({ children, role = "client" }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (session.role !== role) return <Navigate to={session.role === "admin" ? "/admin" : "/portal"} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
      <Route path="/portal" element={<RequireAuth><PortalProvider><PortalLayout /></PortalProvider></RequireAuth>}>
        {PORTAL_PAGES.map(({ path, Component }) =>
          path === "" ? <Route key="index" index element={<Component />} /> : <Route key={path} path={path} element={<Component />} />
        )}
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Route>
      <Route path="/admin" element={<RequireAuth role="admin"><AdminLayout /></RequireAuth>}>
        {ADMIN_PAGES.map(({ path, Component }) =>
          path === "" ? <Route key="index" index element={<Component />} /> : <Route key={path} path={path} element={<Component />} />
        )}
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      {/* Old static URLs */}
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/portal.html" element={<Navigate to="/portal" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
