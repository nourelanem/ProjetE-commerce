import { useEffect, useState } from "react";
import { getUsers, changeUserRole, deleteUser } from "../api/api";
import { useAuth } from "../context/AuthContext";

const ROLES = ["ROLE_CLIENT", "ROLE_ADMIN", "ROLE_SUPERADMIN"];

const roleColor = {
  ROLE_CLIENT: { bg: "#E6F1FB", color: "#185FA5" },
  ROLE_ADMIN: { bg: "#EAF3DE", color: "#3B6D11" },
  ROLE_SUPERADMIN: { bg: "#EEEDFE", color: "#534AB7" },
};

export default function SuperAdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = () => getUsers().then(setUsers);

  const handleRoleChange = async (id, nom) => {
    await changeUserRole(id, nom);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    await deleteUser(id);
    load();
  };

  const filtered = users.filter(u =>
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role?.nom === "ROLE_CLIENT").length,
    admins: users.filter(u => u.role?.nom === "ROLE_ADMIN").length,
    superadmins: users.filter(u => u.role?.nom === "ROLE_SUPERADMIN").length,
  };

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#f8f8f6" }}>

      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e0e0e0", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ fontWeight: 500, fontSize: 16 }}>👑 Super Admin</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#888" }}>👤 {user?.nom}</span>
          <button onClick={logoutUser} style={{ fontSize: 12, color: "#A32D2D", background: "none", border: "0.5px solid #F7C1C1", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ padding: "2rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>Gestion des utilisateurs</h1>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "2rem" }}>
          {[
            { label: "Total", value: stats.total, bg: "#f5f5f5", color: "#444" },
            { label: "Clients", value: stats.clients, bg: "#E6F1FB", color: "#185FA5" },
            { label: "Admins", value: stats.admins, bg: "#EAF3DE", color: "#3B6D11" },
            { label: "Super admins", value: stats.superadmins, bg: "#EEEDFE", color: "#534AB7" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: 12, color: s.color, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="🔍 Rechercher un utilisateur…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, outline: "none", width: 280, marginBottom: "1rem" }}
        />

        {/* Table */}
        <div style={{ background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Nom", "Email", "Rôle actuel", "Changer le rôle", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, color: "#888", borderBottom: "0.5px solid #e0e0e0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ background: u.id === user?.id ? "#fffef0" : "transparent" }}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "#185FA5" }}>
                        {u.nom?.[0]?.toUpperCase() || "?"}
                      </div>
                      {u.nom}
                      {u.id === user?.id && <span style={{ fontSize: 10, background: "#FAEEDA", color: "#854F0B", padding: "1px 6px", borderRadius: 10 }}>vous</span>}
                    </div>
                  </td>
                  <td style={{ ...td, color: "#666" }}>{u.email}</td>
                  <td style={td}>
                    {u.role ? (
                      <span style={{ ...roleColor[u.role.nom], fontSize: 11, padding: "3px 10px", borderRadius: 20 }}>
                        {u.role.nom.replace("ROLE_", "")}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={td}>
                    <select
                      value={u.role?.nom || ""}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                      style={{ padding: "5px 8px", border: "0.5px solid #ccc", borderRadius: 6, fontSize: 13, background: u.id === user?.id ? "#f5f5f5" : "white", cursor: u.id === user?.id ? "not-allowed" : "pointer" }}
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r.replace("ROLE_", "")}</option>
                      ))}
                    </select>
                  </td>
                  <td style={td}>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={u.id === user?.id}
                      style={{ background: "none", border: "0.5px solid #F7C1C1", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: u.id === user?.id ? "not-allowed" : "pointer", color: u.id === user?.id ? "#ccc" : "#A32D2D" }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#bbb" }}>Aucun utilisateur trouvé</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const td = { padding: "12px 16px", borderBottom: "0.5px solid #f5f5f5" };