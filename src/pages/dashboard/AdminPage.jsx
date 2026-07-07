import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Loader, UserCheck, UserX, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    role: "user",
  });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users);
    } catch {
      toast.error("Chargement utilisateurs échoué");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle`);
      setUsers((prev) => prev.map((u) => (u._id === id ? data.user : u)));
      toast.success(data.user.isActive ? "Compte activé" : "Compte désactivé");
    } catch {
      toast.error("Action échouée");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cet utilisateur définitivement ?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("Utilisateur supprimé");
    } catch (err) {
      toast.error(err.response?.data?.error || "Suppression échouée");
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Tous les champs sont requis");
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post("/admin/users", {
        ...form,
        businessName: form.businessName || form.name,
      });
      setUsers((prev) => [data.user, ...prev]);
      setShowForm(false);
      setForm({
        name: "",
        email: "",
        password: "",
        businessName: "",
        role: "user",
      });
      toast.success("Utilisateur créé");
    } catch (err) {
      toast.error(err.response?.data?.error || "Création échouée");
    } finally {
      setCreating(false);
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
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-sub">{users.length} comptes enregistrés</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Ajouter un utilisateur
        </button>
      </div>

      {showForm && (
        <div
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600 }}>Nouvel utilisateur</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(false)}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="field">
              <label>Nom</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nom complet"
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="email@exemple.com"
              />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
            <div className="field">
              <label>Entreprise</label>
              <input
                className="input"
                value={form.businessName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, businessName: e.target.value }))
                }
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className="field">
              <label>Rôle</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <Loader size={14} className="spin" />
            ) : (
              <Plus size={14} />
            )}
            Créer le compte
          </button>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ color: "var(--muted)" }}>{u.email}</td>
                  <td>
                    <span
                      className={`badge ${u.role === "admin" ? "badge-blue" : "badge-gray"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}
                    >
                      {u.isActive ? "Actif" : "Désactivé"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>
                    {format(new Date(u.createdAt), "dd/MM/yyyy")}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className={`btn btn-sm ${u.isActive ? "btn-ghost" : "btn-primary"}`}
                        onClick={() => handleToggle(u._id)}
                        title={u.isActive ? "Désactiver" : "Activer"}
                      >
                        {u.isActive ? (
                          <UserX size={13} />
                        ) : (
                          <UserCheck size={13} />
                        )}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
