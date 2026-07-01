import { useState } from "react";
import { Save, Loader, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../context/authStore.js";

export default function SettingsPage() {
  const { user, updateSettings } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    geminiPromptTemplate: user?.geminiPromptTemplate || "",
    publishHourMin: user?.publishHourMin ?? 9,
    publishHourMax: user?.publishHourMax ?? 21,
    autoGenerate: user?.autoGenerate ?? true,
    generateImage: user?.generateImage ?? true,
    geminiThemes: user?.geminiThemes || [],
  });

  const [newTheme, setNewTheme] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addTheme = () => {
    if (!newTheme.trim()) return;
    set("geminiThemes", [...form.geminiThemes, newTheme.trim()]);
    setNewTheme("");
  };

  const removeTheme = (i) =>
    set("geminiThemes", form.geminiThemes.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (form.publishHourMin >= form.publishHourMax) {
      toast.error("L'heure min doit être inférieure à l'heure max");
      return;
    }
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success("Paramètres sauvegardés");
    } catch {
      toast.error("Sauvegarde échouée");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 620 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-sub">Configuration de votre compte</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader size={15} className="spin" /> : <Save size={15} />}
          Sauvegarder
        </button>
      </div>

      {/* Scheduler */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card-title">Planification</div>

        <div style={{ display: "flex", gap: 14 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Heure min de publication</label>
            <input
              className="input"
              type="number"
              min={0} max={23}
              value={form.publishHourMin}
              onChange={(e) => set("publishHourMin", parseInt(e.target.value))}
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Heure max de publication</label>
            <input
              className="input"
              type="number"
              min={0} max={23}
              value={form.publishHourMax}
              onChange={(e) => set("publishHourMax", parseInt(e.target.value))}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.autoGenerate}
              onChange={(e) => set("autoGenerate", e.target.checked)}
            />
            Génération automatique quotidienne
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.generateImage}
              onChange={(e) => set("generateImage", e.target.checked)}
            />
            Générer une image avec le statut
          </label>
        </div>
      </div>

      {/* Gemini prompt */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card-title">Prompt Gemini</div>
        <div className="field">
          <label>Template du prompt (utilisez {"{theme}"} pour insérer le thème du jour)</label>
          <textarea
            className="textarea"
            rows={5}
            value={form.geminiPromptTemplate}
            onChange={(e) => set("geminiPromptTemplate", e.target.value)}
          />
        </div>
      </div>

      {/* Themes */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card-title">Thèmes ({form.geminiThemes.length})</div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Les thèmes tournent dans l'ordre. Un nouveau thème est utilisé chaque jour.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Nouveau thème…"
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTheme()}
          />
          <button className="btn btn-ghost" onClick={addTheme}>
            <Plus size={15} />
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {form.geminiThemes.map((theme, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 999, padding: "4px 10px", fontSize: 12
            }}>
              {theme}
              <button
                onClick={() => removeTheme(i)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
