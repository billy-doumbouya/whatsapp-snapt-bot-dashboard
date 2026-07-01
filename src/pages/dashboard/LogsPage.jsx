import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

const typeColor = { success: "var(--accent)", error: "var(--danger)", warn: "var(--warn)", info: "var(--info)" };

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/logs?limit=50");
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      toast.error("Chargement logs échoué");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Logs</h1>
          <p className="page-sub">{total} événements enregistrés</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Actualiser
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty"><Loader size={20} className="spin" /></div>
        ) : logs.length === 0 ? (
          <div className="empty">Aucun log disponible</div>
        ) : (
          logs.map((log) => (
            <div className="log-item" key={log._id}>
              <div className={`log-dot ${log.type}`} style={{ background: typeColor[log.type] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{log.message}</div>
                {log.details && (
                  <pre style={{
                    fontSize: 11, color: "var(--muted)", marginTop: 4,
                    background: "var(--surface2)", padding: "4px 8px",
                    borderRadius: 4, overflow: "auto", fontFamily: "var(--mono)"
                  }}>
                    {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                </div>
              </div>
              <span className={`badge badge-${log.type === "success" ? "green" : log.type === "error" ? "red" : log.type === "warn" ? "yellow" : "blue"}`} style={{ alignSelf: "flex-start" }}>
                {log.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
