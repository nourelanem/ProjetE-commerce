import { useEffect, useState } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/api";

export default function Categories() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => { load(); }, []);
  const load = () => getCategories().then(setItems);

  const save = async () => {
    if (editing === "new") await createCategory({ name });
    else await updateCategory(editing.id, { name });
    setEditing(null); setName(""); load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Catégories</h1>
        <button onClick={() => { setEditing("new"); setName(""); }} style={btn}>+ Nouvelle catégorie</button>
      </div>
      {editing && (
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 10, padding: "1rem", marginBottom: "1.5rem", display: "flex", gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la catégorie" style={inp} />
          <button onClick={save} style={btn}>Enregistrer</button>
          <button onClick={() => setEditing(null)} style={btnSec}>Annuler</button>
        </div>
      )}
      <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
        {items.map(c => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
            <span style={{ fontSize: 14 }}>{c.name}</span>
            <div>
              <button onClick={() => { setEditing(c); setName(c.name); }} style={actBtn}>Modifier</button>
              <button onClick={async () => { if (window.confirm("Supprimer ?")) { await deleteCategory(c.id); load(); } }} style={{ ...actBtn, color: "#A32D2D", borderColor: "#F7C1C1" }}>Supprimer</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: 14 }}>Aucune catégorie</div>}
      </div>
    </div>
  );
}

const btn = { background: "#378ADD", color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer" };
const btnSec = { background: "none", border: "0.5px solid #ccc", padding: "9px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer" };
const actBtn = { background: "none", border: "0.5px solid #e0e0e0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", marginLeft: 4 };
const inp = { flex: 1, padding: "8px 10px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14 };