import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./context/authStore.js";
import Layout from "./components/layout/Layout.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import DashboardPage from "./pages/dashboard/DashboardPage.jsx";
import PostsPage from "./pages/dashboard/PostsPage.jsx";
import WhatsAppPage from "./pages/dashboard/WhatsAppPage.jsx";
import SettingsPage from "./pages/dashboard/SettingsPage.jsx";
import AdminPage from "./pages/dashboard/AdminPage.jsx";
import LogsPage from "./pages/dashboard/LogsPage.jsx";

const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuthStore();
  if (loading) return <div className="empty">Chargement…</div>;
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
};

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111827",
            color: "#e8edf5",
            border: "1px solid #1e2d45",
            fontSize: "13px",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
