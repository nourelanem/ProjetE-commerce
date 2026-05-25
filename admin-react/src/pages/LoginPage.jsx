import { useState } from "react";
import { login, register, resendVerification } from "../api/api";
import { useAuth } from "../context/AuthContext";

const brandLogo = "/nounoupara-mark.png";

export default function LoginPage({ onSuccess, onBack, initialMode = "login" }) {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ nom: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const handleResendVerification = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await resendVerification(form.email);
      if (!result) return setError("Serveur indisponible. Reessayez dans un instant.");
      if (result.error) return setError(result.error);
      setSuccess(result.message || "Nouveau lien de verification envoye.");
    } catch {
      setError("Serveur indisponible. Reessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const result = await login(form.email, form.password);
        if (!result) return setError("Serveur indisponible. Reessayez dans un instant.");
        if (result.error) {
          return setError(result.error);
        }

        loginUser(result);
        onSuccess?.(result);
        return;
      }

      const result = await register(form.nom, form.email, form.password);
      if (!result) return setError("Serveur indisponible. Reessayez dans un instant.");
      if (result.error) {
        return setError(result.error);
      }

      setSuccess(result.message || "Compte cree. Verifiez votre boite mail avant connexion.");
      setMode("login");
      setForm({ nom: "", email: form.email, password: "" });
    } catch {
      setError("Serveur indisponible. Reessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <button onClick={onBack} style={styles.backBtn}>Retour boutique</button>
        <div style={styles.brandMark}>
          <img src={brandLogo} alt="NounouPara" style={styles.brandImage} />
        </div>
        <h1 style={styles.title}>{mode === "login" ? "Connexion NounouPara" : "Creation de compte"}</h1>
        <p style={styles.copy}>
          {mode === "login"
            ? "Connectez-vous pour retrouver votre panier et finaliser vos commandes."
            : "Creez votre compte et confirmez votre email pour commander en securite."}
        </p>

        <div style={styles.switcher}>
          <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={tabStyle(mode === "login")}>
            Connexion
          </button>
          <button onClick={() => { setMode("register"); setError(""); setSuccess(""); }} style={tabStyle(mode === "register")}>
            Inscription
          </button>
        </div>

        {success && <div style={styles.success}>{success}</div>}
        {error && <div style={styles.error}>{error}</div>}
        {mode === "login" && error.toLowerCase().includes("verifiez votre email") && (
          <button onClick={handleResendVerification} disabled={!form.email || loading} style={styles.resendBtn}>
            Generer un nouveau lien de verification
          </button>
        )}

        {mode === "register" && (
          <label style={styles.field}>
            <span style={styles.label}>Nom complet</span>
            <input value={form.nom} onChange={update("nom")} style={styles.input} placeholder="Votre nom" />
          </label>
        )}

        <label style={styles.field}>
          <span style={styles.label}>Email</span>
          <input type="email" value={form.email} onChange={update("email")} style={styles.input} placeholder="client@email.com" />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Mot de passe</span>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            style={styles.input}
            placeholder="Votre mot de passe"
          />
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !form.email || !form.password || (mode === "register" && !form.nom)}
          style={{ ...styles.submit, opacity: loading ? 0.65 : 1 }}
        >
          {loading ? "Traitement..." : mode === "login" ? "Se connecter" : "Creer le compte"}
        </button>

        <p style={styles.hint}>Comptes test: client@client.com / client123, admin@admin.com / admin123</p>
      </section>
    </main>
  );
}

const tabStyle = (active) => ({
  flex: 1,
  border: "none",
  borderRadius: 6,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 700,
  color: active ? "#ffffff" : "#52636f",
  background: active ? "#0ea5a0" : "transparent",
});

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(135deg, #e9fbf7 0%, #fff9ef 48%, #f5fbff 100%)",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  },
  panel: {
    width: "min(430px, 100%)",
    background: "#ffffff",
    border: "1px solid #dbe7e2",
    borderRadius: 8,
    padding: 28,
    boxShadow: "0 24px 70px rgba(23, 69, 64, 0.12)",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#0f766e",
    cursor: "pointer",
    fontWeight: 700,
    marginBottom: 20,
    padding: 0,
  },
  brandMark: {
    width: 76,
    height: 76,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    background: "#ffffff",
    border: "1px solid #dbe7e2",
    overflow: "hidden",
    marginBottom: 18,
  },
  brandImage: { width: "100%", height: "100%", objectFit: "contain", padding: 5 },
  title: { margin: 0, fontSize: 28, color: "#193c3a", letterSpacing: 0 },
  copy: { margin: "8px 0 22px", color: "#64746f", lineHeight: 1.55, fontSize: 14 },
  switcher: {
    display: "flex",
    gap: 6,
    padding: 4,
    borderRadius: 8,
    background: "#eef7f4",
    marginBottom: 18,
  },
  success: {
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    padding: "11px 12px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.45,
    marginBottom: 14,
  },
  error: {
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    padding: "11px 12px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.45,
    marginBottom: 14,
  },
  resendBtn: {
    width: "100%",
    border: "1px solid #0f766e",
    background: "#ffffff",
    color: "#0f766e",
    borderRadius: 8,
    padding: "11px 12px",
    cursor: "pointer",
    fontWeight: 800,
    marginBottom: 14,
  },
  field: { display: "block", marginBottom: 14 },
  label: { display: "block", color: "#52636f", fontSize: 12, fontWeight: 800, marginBottom: 7, textTransform: "uppercase" },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #cfded9",
    padding: "0 12px",
    outline: "none",
    fontSize: 14,
    color: "#193c3a",
    boxSizing: "border-box",
  },
  submit: {
    width: "100%",
    border: "none",
    borderRadius: 8,
    background: "#f97316",
    color: "#ffffff",
    padding: "13px 16px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 15,
    marginTop: 4,
  },
  hint: { textAlign: "center", color: "#9aa8a4", fontSize: 12, margin: "18px 0 0" },
};
