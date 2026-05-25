import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ajouterAuPanier,
  commander,
  getCategories,
  getCommandes,
  getPanier,
  getPhotoUrl,
  getProducts,
  supprimerLigne,
  verifyEmail,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import LoginPage from "./LoginPage";

const fallbackCategories = ["Visage", "Corps", "Cheveux", "Maman & bebe", "Solaires", "Hygiene", "Bio"];
const guestCartKey = "parasante_guest_cart";
const brandLogo = "/nounoupara-mark.png";
const routineImage = "/routine-solaire-svr.webp";

export default function ClientDashboard() {
  const { user, loginUser, logoutUser } = useAuth();
  const verificationInProgress = useRef(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [panier, setPanier] = useState(null);
  const [commandes, setCommandes] = useState([]);
  const [view, setView] = useState("catalogue");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [authMode, setAuthMode] = useState(null);
  const [guestLines, setGuestLines] = useState([]);
  const [notice, setNotice] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
    getCategories().then(setCategories);
    try {
      setGuestLines(JSON.parse(localStorage.getItem(guestCartKey) || "[]"));
    } catch {
      localStorage.removeItem(guestCartKey);
    }
  }, []);

  const loadPanier = useCallback(async () => {
    if (!user?.id) return;
    const data = await getPanier(user.id);
    setPanier(data);
  }, [user]);

  const loadCommandes = useCallback(async () => {
    if (!user?.id) return;
    setCommandes(await getCommandes(user.id));
  }, [user]);

  useEffect(() => {
    if (user) {
      loadPanier();
      loadCommandes();
    }
    if (!user) {
      setPanier(null);
      setCommandes([]);
    }
  }, [user, loadPanier, loadCommandes]);

  useEffect(() => {
    localStorage.setItem(guestCartKey, JSON.stringify(guestLines));
  }, [guestLines]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token || verificationInProgress.current) return;
    verificationInProgress.current = true;
    if (user) {
      logoutUser();
    }

    verifyEmail(token).then((result) => {
      if (result?.token) {
        loginUser(result);
      }
      setNotice({
        type: result?.error ? "error" : "success",
        text: result?.error || result?.message || "Email verifie. Vous etes connecte.",
      });
      window.history.replaceState({}, "", window.location.pathname);
    });
  }, [loginUser, logoutUser, user]);

  const handleAjouter = async (product) => {
    if (!user) {
      setGuestLines((current) => {
        const existing = current.find((line) => line.product.id === product.id);
        if (existing) {
          return current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantite: Math.min((product.quantity ?? 1), line.quantite + 1) }
              : line
          );
        }
        return [
          ...current,
          {
            id: `guest-${product.id}`,
            product,
            quantite: 1,
            prixUnitaire: product.price,
            guest: true,
          },
        ];
      });
      setNotice({ type: "success", text: `${product.name} ajoute au panier.` });
      return;
    }
    await ajouterAuPanier(user.id, product.id, 1);
    await loadPanier();
    setNotice({ type: "success", text: `${product.name} ajoute au panier.` });
  };

  const handleLoginSuccess = async (loggedUser) => {
    setAuthMode(null);
    if (guestLines.length) {
      for (const line of guestLines) {
        await ajouterAuPanier(loggedUser.id, line.product.id, line.quantite);
      }
      setGuestLines([]);
      localStorage.removeItem(guestCartKey);
    }
    const data = await getPanier(loggedUser.id);
    setPanier(data);
    setCommandes(await getCommandes(loggedUser.id));
    setView("panier");
    setNotice({ type: "success", text: "Connexion reussie. Votre panier est pret pour la commande." });
  };

  const handleSupprimer = async (ligneId) => {
    if (!user) {
      setGuestLines((current) => current.filter((line) => line.id !== ligneId));
      return;
    }
    await supprimerLigne(ligneId);
    await loadPanier();
  };

  const handleCommander = async () => {
    if (!user) {
      setAuthMode("login");
      return;
    }
    setCheckoutLoading(true);
    try {
      await commander(user.id);
      setPanier(null);
      await loadCommandes();
      setView("historique");
      setNotice({ type: "success", text: "Commande confirmee. Un email recapitulatif vient d'etre envoye." });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const categoryNames = useMemo(() => {
    const names = categories.length ? categories.map((category) => category.name) : fallbackCategories;
    return ["Tous", ...new Set(names)];
  }, [categories]);

  const filtered = products.filter((product) => {
    const normalizedSearch = search.trim().toLowerCase();
    const searchableText = [
      product.name,
      product.description,
      product.category?.name,
      product.supplier?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
    const matchesCategory = selectedCategory === "Tous" || product.category?.name === selectedCategory;
    const price = Number(product.price || 0);
    const min = priceMin === "" ? null : Number(priceMin);
    const max = priceMax === "" ? null : Number(priceMax);
    const matchesMin = min === null || price >= min;
    const matchesMax = max === null || price <= max;
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });

  const hasPriceFilter = priceMin !== "" || priceMax !== "";

  const featured = filtered.slice(0, 8);
  const cartLines = user ? (panier?.lignes || []) : guestLines;
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantite, 0);
  const total = cartLines.reduce((sum, line) => sum + line.prixUnitaire * line.quantite, 0);

  if (authMode) {
    return <LoginPage initialMode={authMode} onSuccess={handleLoginSuccess} onBack={() => setAuthMode(null)} />;
  }

  return (
    <main style={styles.page}>
      <ResponsiveStyles />
      <TopBar
        user={user}
        cartCount={cartCount}
        view={view}
        setView={setView}
        onLogin={() => setAuthMode("login")}
        onRegister={() => setAuthMode("register")}
        onLogout={logoutUser}
      />

      {notice && (
        <div style={{ ...styles.notice, ...(notice.type === "error" ? styles.noticeError : styles.noticeSuccess) }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={styles.noticeClose}>Fermer</button>
        </div>
      )}

      {view === "catalogue" ? (
        <>
          <Hero search={search} setSearch={setSearch} />
          <CategoryStrip categories={categoryNames} selected={selectedCategory} onSelect={setSelectedCategory} />
          <PriceFilter
            min={priceMin}
            max={priceMax}
            onMinChange={setPriceMin}
            onMaxChange={setPriceMax}
            onReset={() => { setPriceMin(""); setPriceMax(""); }}
            active={hasPriceFilter}
          />
          <OfferBand />
          <ProductSection products={featured} onAdd={handleAjouter} />
        </>
      ) : view === "panier" ? (
        <CartView
          lines={cartLines}
          total={total}
          onRemove={handleSupprimer}
          onCatalog={() => setView("catalogue")}
          onCheckout={handleCommander}
          loading={checkoutLoading}
        />
      ) : (
        <OrderHistoryView orders={commandes} onCatalog={() => setView("catalogue")} />
      )}
    </main>
  );
}

function TopBar({ user, cartCount, view, setView, onLogin, onRegister, onLogout }) {
  return (
    <header className="shop-header" style={styles.header}>
      <div style={styles.brand}>
        <div className="shop-logo" style={styles.logo}>
          <img src={brandLogo} alt="NounouPara" style={styles.logoImage} />
        </div>
        <div>
          <strong style={styles.brandName}>NounouPara</strong>
          <span style={styles.brandSub}>Parapharmacie - sante - bien-etre</span>
        </div>
      </div>

      <nav className="shop-nav" style={styles.nav}>
        <button onClick={() => setView("catalogue")} style={navStyle(view === "catalogue")}>Catalogue</button>
        <button onClick={() => setView("panier")} style={navStyle(view === "panier")}>Panier {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}</button>
        {user && <button onClick={() => setView("historique")} style={navStyle(view === "historique")}>Historique</button>}
      </nav>

      <div className="shop-account" style={styles.account}>
        {user ? (
          <>
            <span style={styles.userName}>{user.nom}</span>
            <button onClick={onLogout} style={styles.secondaryBtn}>Deconnexion</button>
          </>
        ) : (
          <>
            <button onClick={onRegister} style={styles.secondaryNeutralBtn}>S'inscrire</button>
            <button onClick={onLogin} style={styles.primaryBtn}>Se connecter</button>
          </>
        )}
      </div>
    </header>
  );
}

function Hero({ search, setSearch }) {
  return (
    <section className="shop-hero" style={styles.hero}>
      <div style={styles.heroText}>
        <span style={styles.kicker}>Livraison rapide en Tunisie</span>
        <h1 style={styles.heroTitle}>NounouPara, vos soins sante et bien-etre au meme endroit.</h1>
        <p style={styles.heroCopy}>Une parapharmacie claire pour parcourir les essentiels de soin, comparer les prix et commander en quelques clics.</p>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un soin, une marque, une categorie..." style={styles.searchInput} />
        </div>
      </div>
      <div className="shop-hero-visual" style={styles.heroVisual}>
        <img src={routineImage} alt="Routine solaire SVR" style={styles.routineImage} />
        <div style={styles.heroCard}>
          <strong>Routine du moment</strong>
          <span>Protection solaire SPF50, hydratation et nettoyant doux.</span>
        </div>
      </div>
    </section>
  );
}

function CategoryStrip({ categories, selected, onSelect }) {
  return (
    <section style={styles.categoryStrip}>
      {categories.map((category) => (
        <button key={category} onClick={() => onSelect(category)} style={categoryStyle(selected === category)}>
          {category}
        </button>
      ))}
    </section>
  );
}

function PriceFilter({ min, max, onMinChange, onMaxChange, onReset, active }) {
  return (
    <section style={styles.priceFilter}>
      <span style={styles.priceFilterLabel}>Filtrer par prix</span>
      <label style={styles.priceField}>
        <span>Min</span>
        <input
          type="number"
          min="0"
          value={min}
          onChange={(event) => onMinChange(event.target.value)}
          placeholder="0 TND"
          style={styles.priceInput}
        />
      </label>
      <label style={styles.priceField}>
        <span>Max</span>
        <input
          type="number"
          min="0"
          value={max}
          onChange={(event) => onMaxChange(event.target.value)}
          placeholder="500 TND"
          style={styles.priceInput}
        />
      </label>
      {active && <button onClick={onReset} style={styles.resetFilterBtn}>Effacer</button>}
    </section>
  );
}

function OfferBand() {
  return (
    <section className="shop-offers" style={styles.offerGrid}>
      <div style={{ ...styles.offer, background: "#ecfdf5" }}>
        <span style={styles.offerLabel}>Offres exceptionnelles</span>
        <strong style={styles.offerTitle}>Jusqu'a -20% sur les soins visage</strong>
      </div>
      <div style={{ ...styles.offer, background: "#fff7ed" }}>
        <span style={styles.offerLabel}>Idees cadeaux</span>
        <strong style={styles.offerTitle}>Coffrets, trousses et routines pretes</strong>
      </div>
      <div style={{ ...styles.offer, background: "#eff6ff" }}>
        <span style={styles.offerLabel}>Solaires</span>
        <strong style={styles.offerTitle}>SPF50 visage et corps pour toute la famille</strong>
      </div>
    </section>
  );
}

function ProductSection({ products, onAdd }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div>
          <span style={styles.kicker}>A la une</span>
          <h2 style={styles.sectionTitle}>Selection NounouPara</h2>
        </div>
        <span style={styles.count}>{products.length} produits</span>
      </div>

      <div className="shop-product-grid" style={styles.productGrid}>
        {products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
        {products.length === 0 && <div style={styles.empty}>Aucun produit disponible pour cette recherche.</div>}
      </div>
    </section>
  );
}

function ProductCard({ product, onAdd }) {
  const inStock = (product.quantity ?? 0) > 0;

  return (
    <article className="shop-product-card" style={styles.productCard}>
      <div className="shop-photo-wrap responsive-product-media" style={styles.photoWrap}>
        {product.photoUrl ? (
          <img className="shop-product-photo" src={getPhotoUrl(product.id)} alt={product.name} style={styles.productPhoto} />
        ) : (
          <div style={styles.photoFallback}>NounouPara</div>
        )}
        {product.category?.name && <span style={styles.productTag}>{product.category.name}</span>}
      </div>
      <div style={styles.productBody}>
        <h3 style={styles.productName}>{product.name}</h3>
        <span style={inStock ? styles.stockOk : styles.stockEmpty}>
          {inStock ? `Stock disponible : ${product.quantity}` : "Rupture de stock"}
        </span>
        {product.description && <p style={styles.productDescription}>{product.description}</p>}
      </div>
      <div style={styles.productFooter}>
        <strong style={styles.price}>{Number(product.price || 0).toFixed(2)} TND</strong>
        <button onClick={() => inStock && onAdd(product)} disabled={!inStock} style={{ ...styles.addBtn, opacity: inStock ? 1 : 0.45, cursor: inStock ? "pointer" : "not-allowed" }}>
          Ajouter
        </button>
      </div>
    </article>
  );
}

function CartView({ lines, total, onRemove, onCatalog, onCheckout, loading }) {
  if (!lines.length) {
    return (
      <section style={styles.cartEmpty}>
        <h1 style={styles.sectionTitle}>Votre panier est vide</h1>
        <p style={styles.heroCopy}>Ajoutez vos soins favoris puis finalisez la commande pour recevoir le mail de confirmation.</p>
        <button onClick={onCatalog} style={styles.primaryBtn}>Voir le catalogue</button>
      </section>
    );
  }

  return (
    <section className="shop-cart-layout" style={styles.cartLayout}>
      <div style={styles.cartList}>
        <div style={styles.sectionHead}>
          <h1 style={styles.sectionTitle}>Mon panier</h1>
          <span style={styles.count}>{lines.length} lignes</span>
        </div>
        {lines.map((line) => (
          <div key={line.id} style={styles.cartLine}>
            <div className="shop-cart-photo" style={styles.cartPhoto}>
              {line.product?.photoUrl ? <img className="shop-product-photo" src={getPhotoUrl(line.product.id)} alt={line.product.name} style={styles.productPhoto} /> : "NounouPara"}
            </div>
            <div style={{ flex: 1 }}>
              <strong style={styles.cartName}>{line.product?.name}</strong>
              <span style={styles.cartMeta}>Quantite {line.quantite} x {Number(line.prixUnitaire || 0).toFixed(2)} TND</span>
            </div>
            <strong style={styles.price}>{(line.quantite * line.prixUnitaire).toFixed(2)} TND</strong>
            <button onClick={() => onRemove(line.id)} style={styles.removeBtn}>X</button>
          </div>
        ))}
      </div>
      <aside style={styles.summary}>
        <h2 style={styles.summaryTitle}>Resume</h2>
        <div style={styles.summaryRow}><span>Sous-total</span><strong>{total.toFixed(2)} TND</strong></div>
        <div style={styles.summaryRow}><span>Livraison</span><strong>Gratuite</strong></div>
        <div style={styles.summaryTotal}><span>Total</span><strong>{total.toFixed(2)} TND</strong></div>
        <button onClick={onCheckout} disabled={loading} style={styles.checkoutBtn}>{loading ? "Validation..." : "Valider la commande"}</button>
      </aside>
    </section>
  );
}

function OrderHistoryView({ orders, onCatalog }) {
  if (!orders.length) {
    return (
      <section style={styles.cartEmpty}>
        <h1 style={styles.sectionTitle}>Aucune commande pour le moment</h1>
        <p style={styles.heroCopy}>Vos commandes validees apparaitront ici avec le detail des produits et le total.</p>
        <button onClick={onCatalog} style={styles.primaryBtn}>Voir le catalogue</button>
      </section>
    );
  }

  return (
    <section style={styles.historyLayout}>
      <div style={styles.sectionHead}>
        <div>
          <span style={styles.kicker}>Compte client</span>
          <h1 style={styles.sectionTitle}>Historique de commandes</h1>
        </div>
        <span style={styles.count}>{orders.length} commande{orders.length !== 1 ? "s" : ""}</span>
      </div>

      <div style={styles.historyList}>
        {orders.map((order) => {
          const lines = order.lignes || [];
          const total = lines.reduce((sum, line) => sum + line.quantite * line.prixUnitaire, 0);
          return (
            <article key={order.id} style={styles.historyCard}>
              <div style={styles.historyHead}>
                <div>
                  <strong style={styles.orderTitle}>Commande #{order.id}</strong>
                  <span style={styles.cartMeta}>{formatOrderDate(order.dateCommande)}</span>
                </div>
                <strong style={styles.price}>{total.toFixed(2)} TND</strong>
              </div>
              <div>
                {lines.map((line) => (
                  <div key={line.id} style={styles.historyLine}>
                    <div className="shop-cart-photo" style={styles.cartPhoto}>
                      {line.product?.photoUrl ? <img className="shop-product-photo" src={getPhotoUrl(line.product.id)} alt={line.product.name} style={styles.productPhoto} /> : "NounouPara"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={styles.cartName}>{line.product?.name}</strong>
                      <span style={styles.cartMeta}>Quantite {line.quantite} x {Number(line.prixUnitaire || 0).toFixed(2)} TND</span>
                    </div>
                    <strong style={styles.price}>{(line.quantite * line.prixUnitaire).toFixed(2)} TND</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatOrderDate(value) {
  if (!value) return "Commande ancienne";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Commande ancienne";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ResponsiveStyles() {
  return (
    <style>{`
      @media (max-width: 900px) {
        .shop-header {
          grid-template-columns: 1fr !important;
          justify-items: stretch !important;
          padding-top: 14px !important;
          padding-bottom: 14px !important;
        }
        .shop-nav, .shop-account {
          justify-content: flex-start !important;
          flex-wrap: wrap !important;
        }
        .shop-hero, .shop-cart-layout {
          grid-template-columns: 1fr !important;
        }
        .shop-offers {
          grid-template-columns: 1fr !important;
        }
        .shop-hero-visual {
          min-height: clamp(260px, 54vw, 380px) !important;
        }
        .shop-product-grid {
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)) !important;
        }
      }

      @media (max-width: 560px) {
        .shop-header {
          gap: 12px !important;
        }
        .shop-nav button, .shop-account button {
          width: auto !important;
        }
        .shop-logo {
          width: 52px !important;
          height: 52px !important;
        }
        .shop-hero {
          min-height: 0 !important;
        }
        .shop-hero-visual {
          min-height: 240px !important;
        }
        .shop-hero-visual img {
          padding: 16px !important;
        }
        .shop-product-grid {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .shop-photo-wrap {
          aspect-ratio: 4 / 3 !important;
        }
        .shop-product-card {
          min-height: 0 !important;
        }
        .shop-cart-photo {
          width: 58px !important;
          height: 58px !important;
        }
        .shop-cart-layout {
          margin-left: 14px !important;
          margin-right: 14px !important;
        }
      }
    `}</style>
  );
}

const navStyle = (active) => ({
  border: "none",
  background: active ? "#e8f7f4" : "transparent",
  color: active ? "#0f766e" : "#41534e",
  borderRadius: 8,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
  position: "relative",
});

const categoryStyle = (active) => ({
  border: `1px solid ${active ? "#0ea5a0" : "#dce8e5"}`,
  background: active ? "#0ea5a0" : "#ffffff",
  color: active ? "#ffffff" : "#31504a",
  borderRadius: 8,
  padding: "11px 16px",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const styles = {
  page: { minHeight: "100vh", background: "#f6faf8", color: "#193c3a", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 20,
    minHeight: 72,
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 18,
    padding: "0 clamp(18px, 4vw, 56px)",
    background: "rgba(255, 255, 255, 0.94)",
    borderBottom: "1px solid #dce8e5",
    backdropFilter: "blur(14px)",
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 62, height: 62, borderRadius: 8, display: "grid", placeItems: "center", background: "#ffffff", border: "1px solid #dce8e5", overflow: "hidden" },
  logoImage: { width: "100%", height: "100%", maxWidth: "100%", objectFit: "contain", padding: 2 },
  brandName: { display: "block", fontSize: 18, color: "#193c3a" },
  brandSub: { display: "block", fontSize: 12, color: "#6d817b" },
  nav: { display: "flex", alignItems: "center", gap: 8 },
  account: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  userName: { color: "#52636f", fontWeight: 700, fontSize: 14 },
  primaryBtn: { border: "none", borderRadius: 8, background: "#0f766e", color: "#ffffff", padding: "11px 16px", cursor: "pointer", fontWeight: 800 },
  secondaryNeutralBtn: { border: "1px solid #cfded9", borderRadius: 8, background: "#ffffff", color: "#0f766e", padding: "10px 14px", cursor: "pointer", fontWeight: 800 },
  secondaryBtn: { border: "1px solid #f5c2c7", borderRadius: 8, background: "#fff1f2", color: "#be123c", padding: "9px 12px", cursor: "pointer", fontWeight: 800 },
  cartBadge: { marginLeft: 6, background: "#f97316", color: "#ffffff", borderRadius: 999, padding: "2px 7px", fontSize: 12 },
  notice: { margin: "18px clamp(18px, 4vw, 56px) 0", borderRadius: 8, padding: "13px 15px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", fontWeight: 700 },
  noticeSuccess: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" },
  noticeError: { background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c" },
  noticeClose: { border: "none", background: "transparent", cursor: "pointer", color: "inherit", fontWeight: 900 },
  hero: {
    margin: "26px clamp(18px, 4vw, 56px) 0",
    minHeight: 410,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
    alignItems: "stretch",
    gap: 22,
  },
  heroText: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: "clamp(26px, 5vw, 58px)", display: "flex", flexDirection: "column", justifyContent: "center" },
  kicker: { color: "#0f766e", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0 },
  heroTitle: { margin: "12px 0", fontSize: "clamp(34px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: 0, maxWidth: 760 },
  heroCopy: { color: "#64746f", lineHeight: 1.65, fontSize: 16, maxWidth: 640 },
  searchBox: { height: 54, display: "flex", alignItems: "center", gap: 12, marginTop: 28, padding: "0 16px", border: "1px solid #cfded9", borderRadius: 8, background: "#f9fcfb" },
  searchIcon: { fontSize: 12, color: "#0f766e", fontWeight: 900, textTransform: "uppercase" },
  searchInput: { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#193c3a", minWidth: 0 },
  heroVisual: { position: "relative", overflow: "hidden", borderRadius: 8, background: "#ffffff", border: "1px solid #dce8e5", minHeight: 360, display: "grid", placeItems: "center" },
  routineImage: { width: "100%", height: "100%", maxWidth: "100%", objectFit: "contain", padding: 28 },
  heroCard: { position: "absolute", left: 24, right: 24, bottom: 24, background: "rgba(255,255,255,.9)", borderRadius: 8, padding: 18, display: "grid", gap: 6, color: "#193c3a" },
  categoryStrip: { margin: "22px clamp(18px, 4vw, 56px)", display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 },
  priceFilter: { margin: "-6px clamp(18px, 4vw, 56px) 24px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 12 },
  priceFilterLabel: { color: "#0f766e", fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginRight: 2 },
  priceField: { display: "flex", alignItems: "center", gap: 8, color: "#52636f", fontSize: 12, fontWeight: 900 },
  priceInput: { width: 120, height: 38, border: "1px solid #cfded9", borderRadius: 8, padding: "0 10px", outline: "none", color: "#193c3a", fontWeight: 700, background: "#f9fcfb" },
  resetFilterBtn: { border: "1px solid #fecdd3", borderRadius: 8, background: "#fff1f2", color: "#be123c", height: 38, padding: "0 12px", cursor: "pointer", fontWeight: 900 },
  offerGrid: { margin: "0 clamp(18px, 4vw, 56px) 30px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 },
  offer: { border: "1px solid #dce8e5", borderRadius: 8, padding: 20, minHeight: 112, display: "grid", alignContent: "center", gap: 6 },
  offerLabel: { color: "#0f766e", fontSize: 12, fontWeight: 900, textTransform: "uppercase" },
  offerTitle: { fontSize: 20, lineHeight: 1.2 },
  section: { margin: "0 clamp(18px, 4vw, 56px) 60px" },
  sectionHead: { display: "flex", alignItems: "end", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  sectionTitle: { margin: 0, fontSize: 30, letterSpacing: 0 },
  count: { color: "#6d817b", fontWeight: 800 },
  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(230px, 100%), 1fr))", gap: 16 },
  productCard: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 390 },
  photoWrap: { position: "relative", aspectRatio: "1 / 1", background: "#edf7f4", overflow: "hidden" },
  productPhoto: { width: "100%", height: "100%", maxWidth: "100%", objectFit: "cover", display: "block" },
  photoFallback: { height: "100%", display: "grid", placeItems: "center", color: "#0f766e", fontWeight: 900, fontSize: 20, padding: 12, textAlign: "center" },
  productTag: { position: "absolute", left: 10, top: 10, background: "#ffffff", color: "#0f766e", borderRadius: 8, padding: "6px 9px", fontSize: 12, fontWeight: 900 },
  productBody: { padding: 15, flex: 1 },
  productName: { margin: 0, color: "#193c3a", fontSize: 16, lineHeight: 1.3 },
  stockOk: { display: "inline-block", marginTop: 8, color: "#047857", fontSize: 12, fontWeight: 900 },
  stockEmpty: { display: "inline-block", marginTop: 8, color: "#be123c", fontSize: 12, fontWeight: 900 },
  productDescription: { margin: "8px 0 0", color: "#71827d", fontSize: 13, lineHeight: 1.45 },
  productFooter: { padding: 15, borderTop: "1px solid #edf2f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  price: { color: "#0f766e", fontSize: 17, whiteSpace: "nowrap" },
  addBtn: { border: "none", borderRadius: 8, background: "#f97316", color: "#ffffff", padding: "10px 13px", cursor: "pointer", fontWeight: 900 },
  empty: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 28, color: "#6d817b" },
  cartEmpty: { margin: "34px clamp(18px, 4vw, 56px)", background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 42, textAlign: "center" },
  cartLayout: { margin: "34px clamp(18px, 4vw, 56px)", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 18, alignItems: "start" },
  cartList: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 20 },
  cartLine: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid #edf2f0" },
  cartPhoto: { width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: "#edf7f4", display: "grid", placeItems: "center", color: "#0f766e", fontWeight: 900, flexShrink: 0 },
  cartName: { display: "block", fontSize: 15, color: "#193c3a" },
  cartMeta: { display: "block", color: "#71827d", fontSize: 13, marginTop: 5 },
  removeBtn: { width: 34, height: 34, border: "1px solid #fecdd3", borderRadius: 8, background: "#fff1f2", color: "#be123c", cursor: "pointer", fontWeight: 900 },
  summary: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 22, position: "sticky", top: 94 },
  summaryTitle: { margin: "0 0 18px", fontSize: 22 },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", color: "#52636f" },
  summaryTotal: { display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid #dce8e5", fontSize: 20 },
  checkoutBtn: { width: "100%", border: "none", borderRadius: 8, background: "#0f766e", color: "#ffffff", padding: "13px 16px", cursor: "pointer", fontWeight: 900, fontSize: 15 },
  historyLayout: { margin: "34px clamp(18px, 4vw, 56px) 60px" },
  historyList: { display: "grid", gap: 16 },
  historyCard: { background: "#ffffff", border: "1px solid #dce8e5", borderRadius: 8, padding: 20 },
  historyHead: { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", paddingBottom: 14, borderBottom: "1px solid #edf2f0" },
  orderTitle: { display: "block", fontSize: 18, color: "#193c3a", marginBottom: 4 },
  historyLine: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #edf2f0" },
};
