import { useState } from "react";
import { Smartphone, Loader, RefreshCw, Unplug } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import { useSocket } from "../../hooks/useSocket.js";

const statusInfo = {
  connected:     { label: "Connecté",      badge: "badge-green",  desc: "Votre WhatsApp est opérationnel. Les statuts seront publiés automatiquement." },
  qr_ready:      { label: "Scan requis",   badge: "badge-yellow", desc: "Scannez le QR code avec votre application WhatsApp → Appareils connectés → Connecter un appareil." },
  initializing:  { label: "Initialisation",badge: "badge-yellow", desc: "Démarrage du client WhatsApp…" },
  loading:       { label: "Chargement",    badge: "badge-yellow", desc: "Restauration de la session…" },
  authenticated: { label: "Authentifié",   badge: "badge-blue",   desc: "Session restaurée, démarrage en cours…" },
  disconnected:  { label: "Déconnecté",    badge: "badge-red",    desc: "Aucune session active. Cliquez sur Connecter pour démarrer." },
};

export default function WhatsAppPage() {
  const { waStatus, qrCode } = useSocket();
  const [loading, setLoading] = useState(false);

  const info = statusInfo[waStatus] || statusInfo.disconnected;

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.post("/whatsapp/connect");
      toast.success("Initialisation démarrée, patientez…");
    } catch (err) {
      toast.error(err.response?.data?.error || "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Déconnecter WhatsApp ?")) return;
    try {
      await api.post("/whatsapp/disconnect");
      toast.success("WhatsApp déconnecté");
    } catch (err) {
      toast.error(err.response?.data?.error || "Déconnexion échouée");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
      <div>
        <h1 className="page-title">WhatsApp</h1>
        <p className="page-sub">Gérez la connexion de votre compte WhatsApp</p>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44,
            background: "var(--surface2)",
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Smartphone size={20} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Statut de connexion</div>
            <span className={`badge ${info.badge}`} style={{ marginTop: 4 }}>{info.label}</span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{info.desc}</p>

        {qrCode && waStatus === "qr_ready" && (
          <div className="qr-box">
            <p style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>SCANNER AVEC WHATSAPP</p>
            <img src={qrCode} alt="QR Code WhatsApp" />
            <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
              Ce code expire après quelques minutes.<br />Actualisez si nécessaire.
            </p>
          </div>
        )}

        {(waStatus === "initializing" || waStatus === "loading") && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)" }}>
            <Loader size={16} className="spin" />
            <span style={{ fontSize: 13 }}>En cours d'initialisation…</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {waStatus === "disconnected" && (
            <button className="btn btn-primary" onClick={handleConnect} disabled={loading}>
              {loading ? <Loader size={15} className="spin" /> : <RefreshCw size={15} />}
              Connecter
            </button>
          )}
          {waStatus === "qr_ready" && (
            <button className="btn btn-ghost" onClick={handleConnect} disabled={loading}>
              <RefreshCw size={15} /> Actualiser le QR
            </button>
          )}
          {waStatus === "connected" && (
            <button className="btn btn-danger" onClick={handleDisconnect}>
              <Unplug size={15} /> Déconnecter
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Guide de connexion</div>
        <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Cliquez sur Connecter pour démarrer",
            "Ouvrez WhatsApp sur votre téléphone",
            'Allez dans Paramètres → Appareils connectés → "Connecter un appareil"',
            "Scannez le QR code affiché",
            "Patientez quelques secondes — la connexion se rétablit automatiquement au redémarrage",
          ].map((step, i) => (
            <li key={i} style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
