import { useRef } from "react";

/**
 * Éditeur de template texte avec variables insérables + aperçu live.
 *
 * Props:
 * - value: string                → le texte du template (ex: "Salut {{businessName}}, ...")
 * - onChange: (val:string)=>void → callback quand le texte change
 * - variables: { key: string, label: string, sample: string }[]
 *     key    → nom inséré dans le texte, ex "businessName" (sera entouré de {{ }})
 *     label  → texte affiché sur le chip, ex "Nom de l'entreprise"
 *     sample → valeur utilisée pour la substitution dans l'aperçu
 * - rows?: number (défaut 5)
 *
 * Exemple d'utilisation dans SettingsPage :
 *
 * <PromptTemplateEditor
 *   value={form.geminiPromptTemplate}
 *   onChange={(v) => set("geminiPromptTemplate", v)}
 *   variables={[
 *     { key: "theme", label: "Thème du jour", sample: "motivation" },
 *     { key: "businessName", label: "Nom entreprise", sample: user?.businessName || "Mon Business" },
 *   ]}
 * />
 */
export default function PromptTemplateEditor({
  value,
  onChange,
  variables = [],
  rows = 5,
  placeholder = "",
}) {
  const textareaRef = useRef(null);

  // Insère {{key}} à la position actuelle du curseur, sans écraser le reste
  const insertVariable = (key) => {
    const el = textareaRef.current;
    const token = `{{${key}}}`;

    if (!el) {
      onChange((value || "") + token);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);

    // remet le focus + curseur juste après la variable insérée
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Remplace toutes les {{key}} connues par leur valeur d'exemple pour l'aperçu
  const renderPreview = (text) => {
    if (!text) return "";
    let out = text;
    variables.forEach(({ key, sample }) => {
      const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      out = out.replace(re, sample ?? `{{${key}}}`);
    });
    return out;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Chips de variables cliquables */}
      {variables.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              title={`Insérer {{${v.key}}}`}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--text, inherit)",
                cursor: "pointer",
              }}
            >
              + {v.label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea libre */}
      <textarea
        ref={textareaRef}
        className="textarea"
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {/* Aperçu live avec substitution */}
      <div
        style={{
          fontSize: 12,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px dashed var(--border)",
          background: "var(--surface2)",
          color: "var(--muted)",
          whiteSpace: "pre-wrap",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
            color: "inherit",
            opacity: 0.8,
          }}
        >
          Aperçu
        </div>
        {renderPreview(value) || "…"}
      </div>
    </div>
  );
}
