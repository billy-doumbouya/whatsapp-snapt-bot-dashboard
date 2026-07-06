import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Wand2, Send, Trash2, Loader, Edit2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

const statusBadge = {
  published: "badge-green",
  scheduled: "badge-blue",
  publishing: "badge-blue", // ← ajouté
  draft: "badge-gray",
  failed: "badge-red",
};
const statusLabel = {
  published: "Publié",
  scheduled: "Schedulé",
  publishing: "Publication en cours...", // ← ajouté
  draft: "Brouillon",
  failed: "Échoué",
};

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState(null); // ← ajouté
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/status?limit=50");
      setPosts(data.posts);
    } catch {
      toast.error("Erreur chargement posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/status/generate");
      toast.success("Post généré !");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Génération échouée");
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async (id) => {
    if (publishingId) return; // ← ignore tout clic si une publication est déjà en cours (ce post ou un autre)
    setPublishingId(id);
    try {
      await api.post(`/status/${id}/publish`);
      toast.success("Publié sur WhatsApp !");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Échec de publication");
      load(); // ← recharge aussi en cas d'échec pour refléter le statut "failed" mis à jour côté backend
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer ce post ?")) return;
    try {
      await api.delete(`/status/${id}`);
      setPosts((p) => p.filter((post) => post._id !== id));
      toast.success("Post supprimé");
    } catch {
      toast.error("Suppression échouée");
    }
  };

  const startEdit = (post) => {
    setEditingId(post._id);
    setEditText(post.text);
  };

  const saveEdit = async (id) => {
    try {
      const { data } = await api.patch(`/status/${id}`, { text: editText });
      setPosts((prev) => prev.map((p) => (p._id === id ? data.post : p)));
      setEditingId(null);
      toast.success("Post modifié");
    } catch {
      toast.error("Modification échouée");
    }
  };

  if (loading)
    return (
      <div className="empty">
        <Loader size={24} className="spin" />
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Publications</h1>
          <p className="page-sub">{posts.length} posts au total</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <Loader size={15} className="spin" />
          ) : (
            <Wand2 size={15} />
          )}
          Générer un post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="empty card">
          <p>Aucun post pour l'instant.</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleGenerate}
            style={{ marginTop: 12 }}
          >
            <Wand2 size={13} /> Générer le premier
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {posts.map((post) => (
            <div className="post-card" key={post._id}>
              {post.imageUrl && (
                <img className="post-card-img" src={post.imageUrl} alt="post" />
              )}
              <div className="post-card-body">
                {editingId === post._id ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <textarea
                      className="textarea"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => saveEdit(post._id)}
                      >
                        <Check size={13} /> Sauvegarder
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="post-card-text">{post.text}</p>
                )}

                <div className="post-card-meta">
                  <span className={`badge ${statusBadge[post.status]}`}>
                    {statusLabel[post.status]}
                  </span>
                  <span>
                    {post.scheduledAt
                      ? format(new Date(post.scheduledAt), "dd/MM HH:mm")
                      : format(new Date(post.createdAt), "dd/MM")}
                  </span>
                </div>

                {post.theme && (
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    📌 {post.theme}
                  </span>
                )}

                <div className="post-card-actions">
                  {post.status !== "published" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handlePublish(post._id)}
                      disabled={
                        publishingId === post._id ||
                        post.status === "publishing"
                      }
                    >
                      {publishingId === post._id ||
                      post.status === "publishing" ? (
                        <>
                          <Loader size={12} className="spin" /> Publication...
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Publier
                        </>
                      )}
                    </button>
                  )}
                  {editingId !== post._id && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => startEdit(post)}
                    >
                      <Edit2 size={12} /> Éditer
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(post._id)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
