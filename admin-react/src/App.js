import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ClientDashboard from "./pages/ClientDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPhotoUrl
} from "./api/api";
import PhotoUpload from "./components/PhotoUpload";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceHover: "#21253a",
  border: "#2a2f45",
  accent: "#6366f1",
  accentLight: "#818cf8",
  accentBg: "rgba(99,102,241,0.12)",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.12)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.12)",
  danger: "#ef4444",
  dangerBg: "rgba(239,68,68,0.12)",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#94a3b8",
  font: "'DM Sans', sans-serif",
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES (injected once)
───────────────────────────────────────────── */
const GlobalStyle = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: ${T.bg}; color: ${T.text}; font-family: ${T.font}; }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      input, select, textarea { font-family: ${T.font}; }
      @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
      .page-enter { animation: fadeIn .25s ease forwards; }
      .badge { display:inline-flex; align-items:center; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:500; letter-spacing:.3px; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
};

/* ─────────────────────────────────────────────
   SHARED UI COMPONENTS
───────────────────────────────────────────── */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", disabled, style }) => {
  const sizes = { sm: { padding: "5px 12px", fontSize: 12 }, md: { padding: "8px 18px", fontSize: 13 }, lg: { padding: "11px 24px", fontSize: 14 } };
  const variants = {
    primary: { background: T.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: T.textDim, border: `1px solid ${T.border}` },
    danger: { background: T.dangerBg, color: T.danger, border: `1px solid rgba(239,68,68,0.25)` },
    success: { background: T.successBg, color: T.success, border: `1px solid rgba(16,185,129,0.25)` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...sizes[size], ...variants[variant],
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: T.font, fontWeight: 500, opacity: disabled ? 0.5 : 1,
      transition: "all .15s", ...style
    }}
      onMouseEnter={e => !disabled && (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={e => !disabled && (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = "text", style }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
    width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 13, outline: "none",
    transition: "border-color .15s", ...style
  }}
    onFocus={e => e.target.style.borderColor = T.accent}
    onBlur={e => e.target.style.borderColor = T.border}
  />
);

const Select = ({ value, onChange, children, style }) => (
  <select value={value} onChange={onChange} style={{
    width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: 8, color: T.text, fontSize: 13, outline: "none", cursor: "pointer", ...style
  }}
    onFocus={e => e.target.style.borderColor = T.accent}
    onBlur={e => e.target.style.borderColor = T.border}
  >
    {children}
  </select>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "1.5rem", width: "90%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", animation: "fadeIn .2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Label = ({ children }) => (
  <label style={{ display: "block", fontSize: 11, color: T.textMuted, marginBottom: 5, fontWeight: 500, letterSpacing: ".4px", textTransform: "uppercase" }}>{children}</label>
);

const FormGroup = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}><Label>{label}</Label>{children}</div>
);

const StatCard = ({ label, value, icon, color, sub }) => (
  <Card style={{ padding: "1.25rem 1.5rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 600, color: T.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 22, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: color + "20", borderRadius: 10 }}>{icon}</div>
    </div>
  </Card>
);

const EmptyState = ({ icon, text, action }) => (
  <div style={{ textAlign: "center", padding: "3rem", color: T.textMuted }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 14, marginBottom: action ? 16 : 0 }}>{text}</div>
    {action}
  </div>
);

/* ─────────────────────────────────────────────
   SIDEBAR NAV
───────────────────────────────────────────── */
const navItems = [
  { key: "dashboard", icon: "◈", label: "Aperçu" },
  { key: "products", icon: "⬡", label: "Produits" },
  { key: "categories", icon: "◉", label: "Catégories" },
  { key: "suppliers", icon: "◎", label: "Fournisseurs" },
];

function Sidebar({ page, setPage, user, onLogout }) {
  return (
    <div style={{
      width: 220, background: T.surface, borderRight: `1px solid ${T.border}`,
      position: "fixed", top: 0, left: 0, height: "100vh",
      display: "flex", flexDirection: "column", zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ padding: "1.5rem", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: T.accent, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⬡</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>NounouPara</div>
            <div style={{ fontSize: 10, color: T.textMuted }}>Gestion parapharmacie</div>
          </div>
        </div>
      </div>

      {/* User pill */}
      <div style={{ margin: "1rem", padding: "10px 12px", background: T.accentBg, border: `1px solid rgba(99,102,241,0.2)`, borderRadius: 10 }}>
        <div style={{ fontSize: 11, color: T.accentLight, fontWeight: 500 }}>Connecté en tant que</div>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500, marginTop: 2 }}>👤 {user?.nom}</div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{user?.email}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 .75rem" }}>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: ".8px", padding: "8px 8px 6px", textTransform: "uppercase" }}>Navigation</div>
        {navItems.map(item => {
          const active = page === item.key;
          return (
            <button key={item.key} onClick={() => setPage(item.key)} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 12px", background: active ? T.accentBg : "transparent",
              border: active ? `1px solid rgba(99,102,241,0.25)` : "1px solid transparent",
              borderRadius: 8, color: active ? T.accentLight : T.textDim,
              fontSize: 13, cursor: "pointer", fontFamily: T.font, fontWeight: active ? 500 : 400,
              marginBottom: 2, transition: "all .15s", textAlign: "left"
            }}
              onMouseEnter={e => !active && (e.currentTarget.style.background = T.surfaceHover)}
              onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: ".75rem" }}>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 12px", background: "transparent", border: `1px solid rgba(239,68,68,0.2)`,
          borderRadius: 8, color: T.danger, fontSize: 13, cursor: "pointer",
          fontFamily: T.font, fontWeight: 500, transition: "all .15s"
        }}
          onMouseEnter={e => e.currentTarget.style.background = T.dangerBg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize: 16 }}>⏏</span> Déconnexion
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────── */
function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, categories: 0, suppliers: 0, withPhoto: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getSuppliers()]).then(([p, c, s]) => {
      setStats({ products: p.length, categories: c.length, suppliers: s.length, withPhoto: p.filter(x => x.photoUrl).length });
      setRecent(p.slice(-6).reverse());
    });
  }, []);

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text }}>Aperçu général</h1>
        <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>Bienvenue dans votre espace d'administration</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: "1.75rem" }}>
        <StatCard label="Produits" value={stats.products} icon="⬡" color={T.accent} sub="articles en catalogue" />
        <StatCard label="Catégories" value={stats.categories} icon="◉" color={T.success} sub="types de produits" />
        <StatCard label="Fournisseurs" value={stats.suppliers} icon="◎" color={T.warning} sub="partenaires actifs" />
        <StatCard label="Avec photo" value={`${stats.withPhoto}/${stats.products}`} icon="🖼" color="#8b5cf6" sub="produits illustrés" />
      </div>

      <Card>
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Produits récents</span>
          <span className="badge" style={{ background: T.accentBg, color: T.accentLight }}>{recent.length} derniers</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["Photo", "Nom", "Prix", "Catégorie", "Fournisseur"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recent.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 16px" }}>
                    {p.photoUrl
                      ? <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "clamp(32px, 7vw, 36px)", height: "clamp(32px, 7vw, 36px)", objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}` }} />
                      : <div style={{ width: 36, height: 36, background: T.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
                    }
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "10px 16px", color: T.accentLight, fontWeight: 500 }}>{p.price.toFixed(2)} €</td>
                  <td style={{ padding: "10px 16px" }}>{p.category ? <span className="badge" style={{ background: T.accentBg, color: T.accentLight }}>{p.category.name}</span> : <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={{ padding: "10px 16px", color: T.textDim }}>{p.supplier?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {recent.length === 0 && <EmptyState icon="📦" text="Aucun produit encore" />}
        </div>
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRODUCTS PAGE
───────────────────────────────────────────── */
const emptyProduct = { name: "", price: "", quantity: "1", description: "", category: "", supplier: "" };

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [savedProduct, setSavedProduct] = useState(null);
  const [showPhotoStep, setShowPhotoStep] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [p, c, s] = await Promise.all([getProducts(), getCategories(), getSuppliers()]);
    setProducts(p); setCategories(c); setSuppliers(s);
  };

  const openCreate = () => { setForm(emptyProduct); setSavedProduct(null); setShowPhotoStep(false); setModal("create"); };
  const openEdit = (p) => {
    setForm({ name: p.name, price: p.price, quantity: p.quantity ?? 0, description: p.description || "", category: p.category?.id ?? "", supplier: p.supplier?.id ?? "" });
    setSavedProduct(p);
    setShowPhotoStep(false);
    setModal(p);
  };
  const openPhoto = (p) => {
    setSavedProduct(p);
    setShowPhotoStep(true);
    setModal(p);
  };
  const closeModal = () => { setModal(null); setSavedProduct(null); setShowPhotoStep(false); load(); };

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      price: parseFloat(form.price),
      quantity: Math.max(0, parseInt(form.quantity || "0", 10)),
      description: form.description,
      category: form.category ? { id: parseInt(form.category) } : null,
      supplier: form.supplier ? { id: parseInt(form.supplier) } : null
    };
    const isCreate = modal === "create";
    const saved = isCreate ? await createProduct(payload) : await updateProduct(modal.id, payload);
    setSavedProduct(saved);
    if (isCreate) {
      setShowPhotoStep(true);
    } else {
      closeModal();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    await deleteProduct(id); load();
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text }}>Produits</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{products.length} article{products.length !== 1 ? "s" : ""} au total</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, fontSize: 14 }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{
              padding: "8px 12px 8px 30px", background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, color: T.text, fontSize: 13, outline: "none", width: 200,
            }} />
          </div>
          {/* View toggle */}
          <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
            {[["grid", "⊞"], ["list", "☰"]].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                border: "none", padding: "7px 12px", background: viewMode === mode ? T.accent : "transparent",
                color: viewMode === mode ? "#fff" : T.textMuted, cursor: "pointer", fontSize: 15, transition: "all .15s"
              }}>{icon}</button>
            ))}
          </div>
          <Btn onClick={openCreate}>+ Nouveau</Btn>
        </div>
      </div>

      {/* GRID */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(210px, 100%), 1fr))", gap: 14 }}>
          {filtered.map(p => (
            <Card key={p.id} style={{ overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent + "60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div className="responsive-product-media" style={{ width: "100%", aspectRatio: "4 / 3", minHeight: 145, maxHeight: 220, background: T.bg, overflow: "hidden", flexShrink: 0 }}>
                {p.photoUrl
                  ? <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "100%", height: "100%", maxWidth: "100%", objectFit: "cover" }} />
                  : <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 36 }}>📦</span>
                    <span style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>Pas de photo</span>
                  </div>
                }
              </div>
              <div style={{ padding: "12px 14px", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.accentLight, marginBottom: 6 }}>{p.price.toFixed(2)} TND</div>
                <div style={{ fontSize: 11, color: p.quantity > 0 ? T.success : T.danger, fontWeight: 600, marginBottom: 6 }}>
                  Stock : {p.quantity ?? 0}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.category && <span className="badge" style={{ background: T.accentBg, color: T.accentLight }}>{p.category.name}</span>}
                  {p.supplier && <span className="badge" style={{ background: T.warningBg, color: T.warning }}>{p.supplier.name}</span>}
                </div>
                {p.description && <p style={{ fontSize: 11, color: T.textMuted, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</p>}
              </div>
              <div style={{ display: "flex", borderTop: `1px solid ${T.border}`, padding: "8px 10px", gap: 6 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(p)} style={{ flex: 1 }}>✏ Modifier</Btn>
                <Btn size="sm" variant="ghost" onClick={() => openPhoto(p)}>Photo</Btn>
                <Btn size="sm" variant="danger" onClick={() => handleDelete(p.id)}>🗑</Btn>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1" }}><EmptyState icon="📦" text="Aucun produit trouvé" /></div>}
        </div>
      )}

      {/* LIST */}
      {viewMode === "list" && (
        <Card style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["Photo", "Nom", "Prix", "Stock", "Catégorie", "Fournisseur", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 16px" }}>
                    {p.photoUrl ? <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "clamp(34px, 7vw, 40px)", height: "clamp(34px, 7vw, 40px)", objectFit: "cover", borderRadius: 8 }} />
                      : <div style={{ width: 40, height: 40, background: T.bg, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>📦</div>}
                  </td>
                  <td style={{ padding: "10px 16px", fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "10px 16px", color: T.accentLight, fontWeight: 500 }}>{p.price.toFixed(2)} TND</td>
                  <td style={{ padding: "10px 16px", color: p.quantity > 0 ? T.success : T.danger, fontWeight: 600 }}>{p.quantity ?? 0}</td>
                  <td style={{ padding: "10px 16px" }}>{p.category ? <span className="badge" style={{ background: T.accentBg, color: T.accentLight }}>{p.category.name}</span> : <span style={{ color: T.textMuted }}>—</span>}</td>
                  <td style={{ padding: "10px 16px", color: T.textDim }}>{p.supplier?.name ?? "—"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Modifier</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => openPhoto(p)}>Photo</Btn>
                      <Btn size="sm" variant="danger" onClick={() => handleDelete(p.id)}>Supprimer</Btn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon="📦" text="Aucun produit trouvé" /></td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* MODAL */}
      {modal && (
        <Modal title={modal === "create" ? "Nouveau produit" : "Modifier le produit"} onClose={closeModal}>
          {!showPhotoStep ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <FormGroup label="Nom *">
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du produit" style={{ gridColumn: "1/-1" }} />
                  </FormGroup>
                </div>
                <FormGroup label="Prix (TND) *">
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </FormGroup>
                <FormGroup label="Quantité en stock *">
                  <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </FormGroup>
                <FormGroup label="Catégorie du produit">
                  <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">— Choisir —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup label="Fournisseur du produit">
                  <Select value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                    <option value="">— Choisir —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </FormGroup>
              </div>
              <FormGroup label="Description">
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description du produit…"
                  style={{ width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, height: 80, resize: "vertical", outline: "none", fontFamily: T.font }} />
              </FormGroup>
              <Btn onClick={handleSubmit} disabled={!form.name || !form.price || form.quantity === ""} style={{ width: "100%", marginTop: 4 }}>
                {modal === "create" ? "Enregistrer le produit →" : "Enregistrer les modifications →"}
              </Btn>
            </>
          ) : (
            <>
              <div style={{ background: T.successBg, border: `1px solid rgba(16,185,129,.2)`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.success, marginBottom: "1rem" }}>
                ✓ Produit enregistré avec succès
              </div>
              <FormGroup label="Photo du produit">
                <PhotoUpload product={savedProduct} onUploaded={u => setSavedProduct(u)} />
              </FormGroup>
              <Btn onClick={closeModal} style={{ width: "100%" }}>Terminer ✓</Btn>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORIES PAGE
───────────────────────────────────────────── */
function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);
  const load = () => getCategories().then(setCategories);

  const openCreate = () => { setForm({ name: "" }); setModal("create"); };
  const openEdit = (c) => { setForm({ name: c.name }); setModal(c); };
  const closeModal = () => { setModal(null); load(); };

  const handleSubmit = async () => {
    modal === "create" ? await createCategory(form) : await updateCategory(modal.id, form);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    await deleteCategory(id); load();
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const colors = [T.accent, T.success, T.warning, "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text }}>Catégories</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{categories.length} catégorie{categories.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{
            padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.text, fontSize: 13, outline: "none", width: 180
          }} />
          <Btn onClick={openCreate}>+ Nouvelle</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
        {filtered.map((c, i) => {
          const color = colors[i % colors.length];
          return (
            <Card key={c.id} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12, transition: "border-color .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = color + "60"}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>◉</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{c.name}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(c)} style={{ flex: 1 }}>✏ Modifier</Btn>
                <Btn size="sm" variant="danger" onClick={() => handleDelete(c.id)}>🗑</Btn>
              </div>
            </Card>
          );
        })}
        {/* Add card */}
        <div onClick={openCreate} style={{
          border: `2px dashed ${T.border}`, borderRadius: 14, padding: "1.25rem",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, cursor: "pointer", color: T.textMuted, transition: "all .2s", minHeight: 120
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accentLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >
          <span style={{ fontSize: 24 }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Nouvelle catégorie</span>
        </div>
      </div>
      {filtered.length === 0 && categories.length > 0 && <EmptyState icon="◉" text="Aucune catégorie trouvée" />}

      {modal && (
        <Modal title={modal === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"} onClose={closeModal}>
          <FormGroup label="Nom de la catégorie *">
            <Input value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Ex: Électronique, Vêtements…"
              onKeyDown={e => e.key === "Enter" && form.name && handleSubmit()} />
          </FormGroup>
          <Btn onClick={handleSubmit} disabled={!form.name} style={{ width: "100%", marginTop: 4 }}>
            {modal === "create" ? "Créer la catégorie" : "Enregistrer les modifications"}
          </Btn>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SUPPLIERS PAGE
───────────────────────────────────────────── */
const emptySupplier = { name: "", email: "", phone: "", address: "" };

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptySupplier);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    setError("");
    try {
      setSuppliers(await getSuppliers());
    } catch (err) {
      setSuppliers([]);
      setError(err.message || "Impossible de charger les fournisseurs.");
    }
  };

  const openCreate = () => { setForm(emptySupplier); setModal("create"); };
  const openEdit = (s) => { setForm({ name: s.name, email: s.email || "", phone: s.phone || "", address: s.address || "" }); setModal(s); };
  const closeModal = () => { setModal(null); load(); };

  const handleSubmit = async () => {
    modal === "create" ? await createSupplier(form) : await updateSupplier(modal.id, form);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce fournisseur ?")) return;
    await deleteSupplier(id); load();
  };

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text }}>Fournisseurs</h1>
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{suppliers.length} partenaire{suppliers.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{
            padding: "8px 12px", background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, color: T.text, fontSize: 13, outline: "none", width: 180
          }} />
          <Btn onClick={openCreate}>+ Nouveau</Btn>
        </div>
      </div>

      {error && (
        <div style={{ background: T.dangerBg, border: `1px solid rgba(239,68,68,.25)`, color: T.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <Card style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>{["Nom", "Email", "Téléphone", "Adresse", "Actions"].map(h => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, color: T.textMuted, fontWeight: 600, letterSpacing: ".4px", textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: T.warningBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: T.warning }}>◎</div>
                    <span style={{ fontWeight: 500, color: T.text }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: T.textDim }}>{s.email || <span style={{ color: T.textMuted }}>—</span>}</td>
                <td style={{ padding: "12px 16px", color: T.textDim }}>{s.phone || <span style={{ color: T.textMuted }}>—</span>}</td>
                <td style={{ padding: "12px 16px", color: T.textDim }}>{s.address || <span style={{ color: T.textMuted }}>—</span>}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>Modifier</Btn>
                    <Btn size="sm" variant="danger" onClick={() => handleDelete(s.id)}>Supprimer</Btn>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5}><EmptyState icon="◎" text="Aucun fournisseur trouvé"
                action={<Btn onClick={openCreate}>+ Ajouter un fournisseur</Btn>}
              /></td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {modal && (
        <Modal title={modal === "create" ? "Nouveau fournisseur" : "Modifier le fournisseur"} onClose={closeModal}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <FormGroup label="Nom *">
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nom du fournisseur" />
              </FormGroup>
            </div>
            <FormGroup label="Email">
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@fournisseur.com" />
            </FormGroup>
            <FormGroup label="Téléphone">
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 00 00 00 00" />
            </FormGroup>
            <div style={{ gridColumn: "1/-1" }}>
              <FormGroup label="Adresse">
                <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" />
              </FormGroup>
            </div>
          </div>
          <Btn onClick={handleSubmit} disabled={!form.name} style={{ width: "100%", marginTop: 4 }}>
            {modal === "create" ? "Créer le fournisseur" : "Enregistrer les modifications"}
          </Btn>
        </Modal>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN DASHBOARD SHELL
───────────────────────────────────────────── */
function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "products": return <ProductsPage />;
      case "categories": return <CategoriesPage />;
      case "suppliers": return <SuppliersPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      <GlobalStyle />
      <Sidebar page={page} setPage={setPage} user={user} onLogout={logoutUser} />
      <main style={{ marginLeft: 220, flex: 1, padding: "2rem", minHeight: "100vh" }}>
        {renderPage()}
      </main>
    </div>
  );
}

function SuperAdminWorkspace() {
  const [section, setSection] = useState("users");

  const tab = (key, label) => (
    <button
      onClick={() => setSection(key)}
      style={{
        padding: "10px 16px",
        border: section === key ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
        borderRadius: 8,
        background: section === key ? T.accentBg : T.surface,
        color: section === key ? T.accentLight : T.textDim,
        cursor: "pointer",
        fontWeight: 600,
        fontFamily: T.font,
      }}
    >
      {label}
    </button>
  );

  if (section === "shop") {
    return (
      <div>
        <div style={{ position: "fixed", top: 18, right: 24, zIndex: 1000, display: "flex", gap: 8 }}>
          {tab("users", "Utilisateurs")}
          {tab("shop", "Gestion boutique")}
        </div>
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", gap: 8 }}>
        {tab("users", "Utilisateurs")}
        {tab("shop", "Gestion boutique")}
      </div>
      <SuperAdminDashboard />
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP ROUTER
───────────────────────────────────────────── */
function AppRouter() {
  const { user } = useAuth();

  if (!user) return <ClientDashboard />;

  switch (user.role) {
    case "ROLE_SUPERADMIN": return <SuperAdminWorkspace />;
    case "ROLE_ADMIN": return <AdminDashboard />;
    case "ROLE_CLIENT": return <ClientDashboard />;
    default: return <ClientDashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

