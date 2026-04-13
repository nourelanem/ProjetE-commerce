import { useEffect, useState } from "react";
import { getProducts, getPhotoUrl, getPanier, ajouterAuPanier, supprimerLigne, commander } from "../api/api";
import { useAuth } from "../context/AuthContext";
import LoginPage from "./LoginPage";

export default function ClientDashboard() {
  const { user, logoutUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [panier, setPanier] = useState(null);
  const [view, setView] = useState("catalogue"); // "catalogue" | "panier"
  const [search, setSearch] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [commandeOk, setCommandeOk] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
    if (user) loadPanier();
  }, [user]);

  const loadPanier = async () => {
    const p = await getPanier(user.id);
    setPanier(p);
  };

  const handleAjouter = async (product) => {
    if (!user) {
      setPendingProduct(product);
      setShowLogin(true);
      return;
    }
    await ajouterAuPanier(user.id, product.id, 1);
    loadPanier();
  };

  const handleLoginSuccess = async (u) => {
    setShowLogin(false);
    if (pendingProduct) {
      await ajouterAuPanier(u.id, pendingProduct.id, 1);
      setPendingProduct(null);
      const p = await getPanier(u.id);
      setPanier(p);
    }
  };

  const handleSupprimer = async (ligneId) => {
    await supprimerLigne(ligneId);
    loadPanier();
  };

  const handleCommander = async () => {
    if (!user) { setShowLogin(true); return; }
    await commander(user.id);
    setCommandeOk(true);
    setPanier(null);
    setTimeout(() => { setCommandeOk(false); setView("catalogue"); }, 3000);
  };

  const nbPanier = panier?.lignes?.length || 0;
  const total = panier?.lignes?.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0) || 0;
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (showLogin) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#f8f8f6" }}>

      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e0e0e0", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ fontWeight: 500, fontSize: 18 }}>🛒 Boutique</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setView("catalogue")} style={{ ...navBtn, color: view === "catalogue" ? "#378ADD" : "#666", borderBottom: view === "catalogue" ? "2px solid #378ADD" : "2px solid transparent" }}>Catalogue</button>
          <button onClick={() => { if (!user) { setShowLogin(true); return; } setView("panier"); }} style={{ ...navBtn, color: view === "panier" ? "#378ADD" : "#666", borderBottom: view === "panier" ? "2px solid #378ADD" : "2px solid transparent", position: "relative" }}>
            Panier
            {nbPanier > 0 && <span style={{ position: "absolute", top: -6, right: -8, background: "#378ADD", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{nbPanier}</span>}
          </button>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#666" }}>👤 {user.nom}</span>
              <button onClick={logoutUser} style={{ fontSize: 12, color: "#A32D2D", background: "none", border: "0.5px solid #F7C1C1", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Déconnexion</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ background: "#378ADD", color: "white", border: "none", padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Se connecter</button>
          )}
        </div>
      </div>

      <div style={{ padding: "2rem" }}>

        {/* Commande confirmée */}
        {commandeOk && (
          <div style={{ background: "#EAF3DE", color: "#3B6D11", borderRadius: 10, padding: "1rem 1.5rem", marginBottom: "1.5rem", fontSize: 15, textAlign: "center" }}>
            ✅ Commande passée avec succès ! Merci pour votre achat.
          </div>
        )}

        {/* ── CATALOGUE ── */}
        {view === "catalogue" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Nos produits</h1>
              <input placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "8px 12px", border: "0.5px solid #ccc", borderRadius: 8, fontSize: 14, outline: "none", width: 220 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filtered.map(p => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 200, background: "#f8f8f6", overflow: "hidden" }}>
                    {p.photoUrl ? (
                      <img src={getPhotoUrl(p.id)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>📦</div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                    {p.category && <span style={{ background: "#E6F1FB", color: "#185FA5", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{p.category.name}</span>}
                    {p.description && <p style={{ fontSize: 12, color: "#999", marginTop: 6, lineHeight: 1.4 }}>{p.description}</p>}
                  </div>
                  <div style={{ padding: "10px 14px", borderTop: "0.5px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 500, fontSize: 16, color: "#378ADD" }}>{p.price.toFixed(2)} €</span>
                    <button onClick={() => handleAjouter(p)} style={{ background: "#378ADD", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
                      + Panier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── PANIER ── */}
        {view === "panier" && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>Mon panier</h1>

            {(!panier?.lignes || panier.lignes.length === 0) ? (
              <div style={{ textAlign: "center", color: "#bbb", padding: "3rem", background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 15 }}>Votre panier est vide</div>
                <button onClick={() => setView("catalogue")} style={{ marginTop: 16, background: "#378ADD", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>Voir le catalogue</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>
                {/* Lignes */}
                <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0", overflow: "hidden" }}>
                  {panier.lignes.map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                      <div style={{ width: 56, height: 56, background: "#f8f8f6", borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                        {l.product.photoUrl ? <img src={getPhotoUrl(l.product.id)} alt={l.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📦</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{l.product.name}</div>
                        <div style={{ fontSize: 13, color: "#888" }}>Qté : {l.quantite} × {l.prixUnitaire.toFixed(2)} €</div>
                      </div>
                      <div style={{ fontWeight: 500, color: "#378ADD" }}>{(l.quantite * l.prixUnitaire).toFixed(2)} €</div>
                      <button onClick={() => handleSupprimer(l.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 16 }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Résumé commande */}
                <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid #e0e0e0", padding: "1.25rem" }}>
                  <div style={{ fontWeight: 500, fontSize: 16, marginBottom: "1rem" }}>Résumé</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: "#666" }}>Sous-total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 16 }}>
                    <span style={{ color: "#666" }}>Livraison</span>
                    <span style={{ color: "#3B6D11" }}>Gratuite</span>
                  </div>
                  <div style={{ borderTop: "0.5px solid #e0e0e0", paddingTop: 12, display: "flex", justifyContent: "space-between", fontWeight: 500, fontSize: 16, marginBottom: 16 }}>
                    <span>Total</span>
                    <span style={{ color: "#378ADD" }}>{total.toFixed(2)} €</span>
                  </div>
                  <button onClick={handleCommander} style={{ width: "100%", background: "#378ADD", color: "white", border: "none", padding: "11px 0", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 500 }}>
                    Passer la commande
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const navBtn = { background: "none", border: "none", borderBottom: "2px solid transparent", padding: "0 4px", height: 56, fontSize: 14, cursor: "pointer", position: "relative" };