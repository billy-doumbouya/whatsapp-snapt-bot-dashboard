import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Clock, AlertCircle, FileText, Loader, Wand2, Send } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import { useSocket } from "../../hooks/useSocket.js";

const statusLabel = { published: "Publié", scheduled: "Schedulé", draft: "Brouillon", failed: "Échoué" };
const statusBadge = { published: "badge-green", scheduled: "badge-blue", draft: "badge-gray", failed: "badge-red" };

export default function DashboardPage() {
  const [todayPost, setTodayPost] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const { waStatus } = useSocket();

  const loadData = async () => {
    try {
      const [todayRes, postsRes, logsRes] = await Promise.all([
        api.get("/posts/today"),
        api.get("/posts?limit=100"),
        api.get("/logs?limit=8"),
      ]);
      setTodayPost(todayRes.data.post);
      const posts = postsRes.data.posts;
      setStats({
        total: posts.length,
        published: posts.filter((p) => p.status === "published").length,
        scheduled: posts.filter((p) => p.status === "scheduled").length,
        failed: posts.filter((p) => p.status === "failed").length,
      });
      setRecentLogs(logsRes.data.logs);
    } catch {
      toast.error("Erreur chargement données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/posts/generate");
      setTodayPost(data.post);
      toast.success("Post généré avec succès !");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Génération échouée");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!todayPost) return;
    setPublishing(true);
    try {
      await api.post(`/posts/${todayPost._id}/publish`);
      toast.success("Statut publié !");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || "Publication échouée");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="empty"><Loader size={24} className="spin" /><p>Chargement…</p></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader size={15} className="spin" /> : <Wand2 size={15} />}
            Générer un post
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={publishing || !todayPost || waStatus !== "connected"}
          >
            {publishing ? <Loader size={15} className="spin" /> : <Send size={15} />}
            Publier maintenant
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: "Total posts", value: stats?.total ?? 0, icon: FileText, color: "var(--info)" },
          { label: "Publiés", value: stats?.published ?? 0, icon: CheckCircle, color: "var(--accent)" },
          { label: "Schedulés", value: stats?.scheduled ?? 0, icon: Clock, color: "var(--warn)" },
          { label: "Échoués", value: stats?.failed ?? 0, icon: AlertCircle, color: "var(--danger)" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="label">{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="value" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Post du jour */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-title">Post du jour</div>
          {todayPost ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {todayPost.imageUrl && (
                <img src={todayPost.imageUrl} alt="statut" style={{ borderRadius: 8, width: "100%", height: 140, objectFit: "cover" }} />
              )}
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{todayPost.text}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`badge ${statusBadge[todayPost.status]}`}>
                  {statusLabel[todayPost.status]}
                </span>
                {todayPost.scheduledAt && (
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    🕐 {format(new Date(todayPost.scheduledAt), "HH:mm")}
                  </span>
                )}
              </div>
              {todayPost.theme && (
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Thème : {todayPost.theme}</span>
              )}
            </div>
          ) : (
            <div className="empty" style={{ padding: 24 }}>
              <p style={{ marginBottom: 12 }}>Aucun post pour aujourd'hui</p>
              <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader size={13} className="spin" /> : <Wand2 size={13} />}
                Générer
              </button>
            </div>
          )}
        </div>

        {/* Logs récents */}
        <div className="card">
          <div className="card-title">Activité récente</div>
          {recentLogs.length === 0 ? (
            <div className="empty" style={{ padding: 16 }}>Aucune activité</div>
          ) : (
            recentLogs.map((log) => (
              <div className="log-item" key={log._id}>
                <div className={`log-dot ${log.type}`} />
                <div style={{ flex: 1 }}>
                  <div>{log.message}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {format(new Date(log.createdAt), "HH:mm")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
