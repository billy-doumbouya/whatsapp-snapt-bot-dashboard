import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../context/authStore.js";
import { Zap, Loader } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: "var(--accent)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <img
              src="/logo.png"
              alt="logo"
              className="logo"
              style={{ width: 24, height: 24 }}
            />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>
            StatusBot
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            Connectez-vous à votre espace
          </p>
        </div>

        <div className="card">
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
            >
              {loading ? <Loader size={15} className="spin" /> : null}
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
