import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AdminLayout from "./layouts/AdminLayout";
import { ADMIN_PAGES } from "./pages/admin/registry";
import ClientDetail from "./pages/admin/ClientDetail";
import { PortalProvider } from "./context/PortalContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PortalLayout from "./layouts/PortalLayout";
import { PORTAL_PAGES } from "./pages/portal/registry";

function RequireAuth({ children, role = "client" }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="empty" style={{ paddingTop: 120 }}>Loading…</div>;
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (session.role !== role) return <Navigate to={session.role === "admin" ? "/admin" : "/portal"} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
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
  );
}
