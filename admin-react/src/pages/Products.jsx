import { useEffect, useState } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getSuppliers,
  getPhotoUrl,
} from "../api/api";
import PhotoUpload from "../components/PhotoUpload";

const emptyForm = { name: "", price: "", description: "", category: "", supplier: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [savedProduct, setSavedProduct] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [p, c, s] = await Promise.all([getProducts(), getCategories(), getSuppliers()]);
    setProducts(p); setCategories(c); setSuppliers(s);
  };

  const openCreate = () => { setForm(emptyForm); setSavedProduct(null); setModal("create"); };

  const openEdit = (product) => {
    setForm({ name: product.name, price: product.price, description: product.description || "", category: product.category?.id ?? "", supplier: product.supplier?.id ?? "" });
    setSavedProduct(product);
    setModal(product);
  };

  const closeModal = () => { setModal(null); setSavedProduct(null); load(); };

  const handleSubmit = async () => {
    const payload = { name: form.name, price: parseFloat(form.price), description: form.description, category: form.category ? { id: parseInt(form.category) } : null, supplier: form.supplier ? { id: parseInt(form.supplier) } : null };
    const saved = modal === "create" ? await createProduct(payload) : await updateProduct(modal.id, payload);
    setSavedProduct(saved);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    await deleteProduct(id); load();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Produits</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", border: "0.5px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setViewMode("grid")} title="Grille" style={{ border: "none", padding: "7px 13px", fontSize: 17, cursor: "pointer", background: viewMode === "grid" ? "#378ADD" : "transparent", color: viewMode === "grid" ? "white" : "#666" }}>⊞</button>
            <button onClick={() => setViewMode("list")} title="Liste" style={{ border: "none", padding: "7px 13px", fontSize: 17, cursor: "pointer", background: viewMode === "list" ? "#378ADD" : "transparent", color: viewMode === "list" ? "white" : "#666" }}>☰</button>
          </div>
          <button onClick={openCreate} style={{ background: "#378ADD", color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 500 }}>+ Nouveau produit</button>
        </div>
      </div>

      {/* Search */}
      <input placeholder="🔍  Rechercher un produit…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "min(280px, 100%)", padding: "8px 12px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: "1.5rem" }} />

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <div key={p.id} style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Big photo */}
              <div className="responsive-product-media" style={{ width: "100%", aspectRatio: "4 / 3", minHeight: 150, maxHeight: 220, background: "#f8f8f6", overflow: "hidden", flexShrink: 0 }}>
                {p.photoUrl ? (
                  <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "100%", height: "100%", maxWidth: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 44 }}>📦</span>
                    <span style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>Pas de photo</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "12px 14px", flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, color: "#222" }}>{p.name}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#378ADD", marginBottom: 6 }}>{p.price.toFixed(2)} €</div>
                {p.category && <span style={{ background: "#E6F1FB", color: "#185FA5", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{p.category.name}</span>}
                {p.description && <p style={{ fontSize: 12, color: "#999", marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.description}</p>}
              </div>
              {/* Footer buttons */}
              <div style={{ display: "flex", borderTop: "0.5px solid #f0f0f0", padding: "8px 10px", gap: 6 }}>
                <button onClick={() => openEdit(p)} style={{ flex: 1, background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer" }}>✏️ Modifier</button>
                <button onClick={() => handleDelete(p.id)} style={{ background: "#FFF0F0", color: "#A32D2D", border: "none", borderRadius: 6, padding: "7px 10px", fontSize: 14, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#bbb", padding: "3rem" }}>Aucun produit trouvé</div>}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>{["Photo", "Nom", "Prix", "Catégorie", "Fournisseur", "Actions"].map((h) => <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "0.5px solid #e0e0e0" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                    {p.photoUrl ? <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "clamp(36px, 8vw, 44px)", height: "clamp(36px, 8vw, 44px)", maxWidth: "100%", objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: "clamp(36px, 8vw, 44px)", height: "clamp(36px, 8vw, 44px)", background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>}
                  </td>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5", fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>{p.price.toFixed(2)} €</td>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>{p.category ? <span style={{ background: "#E6F1FB", color: "#185FA5", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{p.category.name}</span> : "—"}</td>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>{p.supplier?.name ?? "—"}</td>
                  <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                    <button onClick={() => openEdit(p)} style={{ background: "none", border: "0.5px solid #e0e0e0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", marginRight: 4 }}>Modifier</button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "0.5px solid #F7C1C1", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#A32D2D" }}>Supprimer</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "#bbb" }}>Aucun produit trouvé</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "90%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{modal === "create" ? "Nouveau produit" : "Modifier le produit"}</h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Nom *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} placeholder="Nom du produit" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Prix (€) *</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Catégorie</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}>
                  <option value="">— Choisir —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Fournisseur</label>
                <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}>
                  <option value="">— Choisir —</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, height: 80, resize: "vertical", boxSizing: "border-box" }} placeholder="Description du produit" />
              </div>
            </div>
            {!savedProduct ? (
              <button onClick={handleSubmit} disabled={!form.name || !form.price} style={{ background: "#378ADD", color: "white", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 14, cursor: "pointer", width: "100%", marginTop: "1rem", fontWeight: 500 }}>
                Enregistrer →
              </button>
            ) : (
              <>
                <div style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 8, padding: "8px 12px", fontSize: 13, margin: "1rem 0" }}>✓ Produit enregistré — ajoutez une photo ci-dessous</div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Photo du produit</label>
                  <PhotoUpload product={savedProduct} onUploaded={(u) => setSavedProduct(u)} />
                </div>
                <button onClick={closeModal} style={{ background: "#378ADD", color: "white", border: "none", padding: "10px 0", borderRadius: 8, fontSize: 14, cursor: "pointer", width: "100%", fontWeight: 500 }}>Terminer ✓</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
