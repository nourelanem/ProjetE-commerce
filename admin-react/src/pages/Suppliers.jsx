import { useEffect, useState } from "react";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "../api/api";

const empty = { name: "", email: "", phone: "", address: "" };

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);

  useEffect(() => { load(); }, []);
  const load = () => getSuppliers().then(setItems);

  const open = (s = null) => { setForm(s ? { name: s.name, email: s.email, phone: s.phone, address: s.address } : empty); setModal(s || "new"); };
  const save = async () => { if (modal === "new") await createSupplier(form); else await updateSupplier(modal.id, form); setModal(null); load(); };
  const f = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Fournisseurs</h1>
        <button onClick={() => open()} style={btn}>+ Nouveau fournisseur</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map(s => (
          <div key={s.id} style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>{s.email}</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>{s.phone}</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>{s.address}</div>
            <div>
              <button onClick={() => open(s)} style={actBtn}>Modifier</button>
              <button onClick={async () => { if (window.confirm("Supprimer ?")) { await deleteSupplier(s.id); load(); } }} style={{ ...actBtn, color: "#A32D2D", borderColor: "#F7C1C1" }}>Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "90%", maxWidth: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>{modal === "new" ? "Nouveau fournisseur" : "Modifier"}</h2>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>×</button>
            </div>
            {[["Nom", "name"], ["Email", "email"], ["Téléphone", "phone"], ["Adresse", "address"]].map(([label, key]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>{label}</label>
                <input value={form[key]} onChange={f(key)} style={inp} placeholder={label} />
              </div>
            ))}
            <button onClick={save} style={{ ...btn, width: "100%", marginTop: 8 }}>Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btn = { background: "#378ADD", color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer" };
const actBtn = { background: "none", border: "0.5px solid #e0e0e0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", marginLeft: 4 };
const inp = { width: "100%", padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };