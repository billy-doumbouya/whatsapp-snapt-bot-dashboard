import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Settings,
  Users,
  ScrollText,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../context/authStore.js";
import { useSocket } from "../../hooks/useSocket.js";

const WaDot = ({ status }) => (
  <span
    className={`wa-dot ${status}`}
    style={{
      width: 7,
      height: 7,
      borderRadius: "50%",
      display: "inline-block",
    }}
  />
);

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { waStatus } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/posts", icon: MessageSquare, label: "Publications" },
    { to: "/whatsapp", icon: Smartphone, label: "WhatsApp" },
    { to: "/logs", icon: ScrollText, label: "Logs" },
    { to: "/settings", icon: Settings, label: "Paramètres" },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="dot ">
            {/* <Zap size={14} /> */}
            <img src="/logo.png" alt="logo" className="logo" />
          </div>
          <span>StatusBot</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <>
              <div className="nav-section">Admin</div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Users size={16} />
                Utilisateurs
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="wa-pill" style={{ marginBottom: 10, fontSize: 11 }}>
            <WaDot status={waStatus} />
            WhatsApp :{" "}
            {waStatus === "connected"
              ? "Connecté"
              : waStatus === "qr_ready"
                ? "Scan requis"
                : "Déconnecté"}
          </div>
          <div className="user-chip">
            <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="info">
              <div className="name">{user?.name}</div>
              <div className="role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title="Déconnexion"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
