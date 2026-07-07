import { useState } from "react";
import { Save, Loader, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../context/authStore.js";
import api from "../../services/api.js";
import PromptTemplateEditor from "../../ui/PromptTemplateEditor .jsx";

export default function SettingsPage() {
  const { user, updateSettings } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [newTheme, setNewTheme] = useState("");

  // État du formulaire incluant désormais businessName
  const [form, setForm] = useState({
    businessName: user?.businessName || "",
    geminiPromptTemplate: user?.geminiPromptTemplate || "",
    assistantPrompt: user?.assistantPrompt || "",
    botEnabled: user?.botEnabled ?? true,
    publishHourMin: user?.publishHourMin ?? 9,
    publishHourMax: user?.publishHourMax ?? 21,
    autoGenerate: user?.autoGenerate ?? true,
    generateImage: user?.generateImage ?? true,
    geminiThemes: user?.geminiThemes || [],
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addTheme = () => {
    if (!newTheme.trim()) return;
    set("geminiThemes", [...form.geminiThemes, newTheme.trim()]);
    setNewTheme("");
  };

  const removeTheme = (i) =>
    set(
      "geminiThemes",
      form.geminiThemes.filter((_, idx) => idx !== i),
    );

  const handleSave = async () => {
    // 🛑 Blocage de sécurité : businessName obligatoire
    if (!form.businessName || !form.businessName.trim()) {
      toast.error("Veuillez d'abord renseigner le nom de votre entreprise !");
      return;
    }
    if (form.publishHourMin >= form.publishHourMax) {
      toast.error("L'heure min doit être inférieure à l'heure max");
      return;
    }
    if (!form.assistantPrompt.trim()) {
      toast.error("Le prompt de l'assistant ne peut pas être vide");
      return;
    }

    setSaving(true);

    // Séparation des données pour les différents endpoints
    const { botEnabled, assistantPrompt, ...generalSettings } = form;

    const [generalRes, promptRes, toggleRes] = await Promise.allSettled([
      updateSettings(generalSettings),
      api.patch("/whatsapp/prompt", { assistantPrompt }),
      api.post("/whatsapp/toggle", { enabled: botEnabled }),
    ]);

    // Resynchronisation manuelle du store pour les routes spécifiques WhatsApp
    if (promptRes.status === "fulfilled") {
      useAuthStore.setState((s) => ({
        user: {
          ...s.user,
          assistantPrompt: promptRes.value.data.user.assistantPrompt,
        },
      }));
    }
    if (toggleRes.status === "fulfilled") {
      useAuthStore.setState((s) => ({
        user: { ...s.user, botEnabled: toggleRes.value.data.botEnabled },
      }));
    }

    // Analyse des réussites / échecs
    const failed = [];
    if (generalRes.status === "rejected") failed.push("paramètres généraux");
    if (promptRes.status === "rejected") failed.push("prompt assistant");
    if (toggleRes.status === "rejected") failed.push("statut du bot");

    if (failed.length === 0) {
      toast.success("Paramètres sauvegardés avec succès !");
    } else {
      toast.error(`Échec de sauvegarde : ${failed.join(", ")}`);
    }

    setSaving(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 620,
      }}
    >
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-sub">Configuration de votre compte</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader size={15} className="spin" /> : <Save size={15} />}
          Sauvegarder
        </button>
      </div>

      {/* BLOC UNIQUE & OBLIGATOIRE : Informations de l'entreprise */}
      <div
        className="card"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div className="card-title">Informations de l'entreprise</div>
        <div className="field">
          <label>Nom de l'entreprise</label>
          <input
            className="input"
            type="text"
            placeholder="Ex: G-tech-academy"
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
        </div>
      </div>

      {/* AFFICHAGE CONDITIONNEL : Le reste ne s'affiche que si businessName est valide */}
      {!form.businessName || !form.businessName.trim() ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--muted)",
            border: "1px dashed var(--border)",
            fontSize: 14,
          }}
        >
          💡 Veuillez renseigner le nom de votre entreprise ci-dessus pour
          débloquer l'accès aux autres configurations (Assistant, Planification,
          Prompts).
        </div>
      ) : (
        <>
          {/* Planification (Scheduler) */}
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div className="card-title">Planification</div>

            <div style={{ display: "flex", gap: 14 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Heure min de publication</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={23}
                  value={form.publishHourMin}
                  onChange={(e) =>
                    set("publishHourMin", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Heure max de publication</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={23}
                  value={form.publishHourMax}
                  onChange={(e) =>
                    set("publishHourMax", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 20 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.autoGenerate}
                  onChange={(e) => set("autoGenerate", e.target.checked)}
                />
                Génération automatique quotidienne
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.generateImage}
                  onChange={(e) => set("generateImage", e.target.checked)}
                />
                Générer une image avec le statut
              </label>
            </div>
          </div>

          {/* Assistant WhatsApp */}
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="card-title">Assistant WhatsApp</div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.botEnabled}
                onChange={(e) => set("botEnabled", e.target.checked)}
              />
              Activer les réponses automatiques
            </label>

            <div className="field">
              <label>
                Prompt de l'assistant — utilisez les variables ci-dessous
              </label>
              <PromptTemplateEditor
                value={form.assistantPrompt}
                onChange={(v) => set("assistantPrompt", v)}
                variables={[
                  {
                    key: "businessName",
                    label: "Nom entreprise",
                    sample: form.businessName, // Passe l'état actuel en direct pour l'aperçu
                  },
                ]}
              />
            </div>
          </div>

          {/* Prompt Gemini */}
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="card-title">Prompt Gemini</div>
            <div className="field">
              <label>
                Template du prompt — utilisez les variables dynamiques
              </label>
              <PromptTemplateEditor
                value={form.geminiPromptTemplate}
                onChange={(v) => set("geminiPromptTemplate", v)}
                variables={[
                  {
                    key: "theme",
                    label: "Thème du jour",
                    sample: "motivation",
                  },
                  {
                    key: "businessName",
                    label: "Nom entreprise",
                    sample: form.businessName, // Passe l'état actuel en direct pour l'aperçu
                  },
                ]}
              />
            </div>
          </div>

          {/* Thèmes de rotation */}
          <div
            className="card"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div className="card-title">
              Thèmes ({form.geminiThemes.length})
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              Les thèmes tournent dans l'ordre. Un nouveau thème est utilisé
              chaque jour.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="input"
                placeholder="Nouveau thème…"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTheme()}
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={addTheme}
              >
                <Plus size={15} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form.geminiThemes.map((theme, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                  }}
                >
                  {theme}
                  <button
                    type="button"
                    onClick={() => removeTheme(i)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
