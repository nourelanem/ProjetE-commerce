import { useState } from "react";
import { login, register } from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onSuccess }) {
  const { loginUser } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ nom: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "login") {
        result = await login(form.email, form.password);
      } else {
        result = await register(form.nom, form.email, form.password);
      }
      if (result.error) {
        setError(result.error);
      } else {
        loginUser(result);
        onSuccess?.(result);
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e0e0e0", padding: "2rem", width: "90%", maxWidth: 400 }}>

        {/* Logo / titre */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
            {mode === "login" ? "Se connecter" : "Créer un compte"}
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            {mode === "login" ? "Bienvenue ! Entrez vos identifiants." : "Remplissez le formulaire pour créer votre compte."}
          </p>
        </div>

        {/* Tabs login / register */}
        <div style={{ display: "flex", border: "0.5px solid #e0e0e0", borderRadius: 8, marginBottom: "1.5rem", overflow: "hidden" }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "9px 0", border: "none", background: mode === m ? "#378ADD" : "transparent", color: mode === m ? "white" : "#666", fontSize: 14, cursor: "pointer", fontWeight: mode === m ? 500 : 400 }}>
              {m === "login" ? "Se connecter" : "S'inscrire"}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        {mode === "register" && (
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Nom complet</label>
            <input value={form.nom} onChange={f("nom")} style={inp} placeholder="Votre nom" />
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Email</label>
          <input type="email" value={form.email} onChange={f("email")} style={inp} placeholder="email@exemple.com" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Mot de passe</label>
          <input type="password" value={form.password} onChange={f("password")} style={inp} placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && (
          <div style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", background: "#378ADD", color: "white", border: "none", padding: "11px 0", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 500, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Chargement…" : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>

        {/* Hint compte super admin */}
        <p style={{ fontSize: 11, color: "#bbb", textAlign: "center", marginTop: "1rem" }}>
          Super admin : superadmin@admin.com / admin123
        </p>
      </div>
    </div>
  );
}

const lbl = { display: "block", fontSize: 12, color: "#888", marginBottom: 4 };
const inp = { width: "100%", padding: "9px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };