import { useEffect, useState } from "react";
import { getProducts, getCategories, getSuppliers, getPhotoUrl } from "../api/api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    suppliers: 0,
    withPhoto: 0,
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    Promise.all([getProducts(), getCategories(), getSuppliers()]).then(
      ([products, categories, suppliers]) => {
        setStats({
          products: products.length,
          categories: categories.length,
          suppliers: suppliers.length,
          withPhoto: products.filter((p) => p.photoUrl).length,
        });
        setRecent(products.slice(-5).reverse());
      }
    );
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>
        Dashboard
      </h1>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Produits", value: stats.products, color: "#E6F1FB", text: "#185FA5" },
          { label: "Catégories", value: stats.categories, color: "#EAF3DE", text: "#3B6D11" },
          { label: "Fournisseurs", value: stats.suppliers, color: "#FAEEDA", text: "#854F0B" },
          {
            label: "Avec photo",
            value: `${stats.withPhoto} / ${stats.products}`,
            color: "#EEEDFE",
            text: "#534AB7",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: s.color,
              borderRadius: 10,
              padding: "1rem 1.25rem",
            }}
          >
            <div style={{ fontSize: 12, color: s.text, marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 500, color: s.text }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent products */}
      <div
        style={{
          background: "#fff",
          border: "0.5px solid #e0e0e0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "0.5px solid #e0e0e0",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          Produits récents
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {["Photo", "Nom", "Prix", "Catégorie"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 16px",
                    textAlign: "left",
                    fontSize: 12,
                    color: "#888",
                    borderBottom: "0.5px solid #e0e0e0",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id}>
                <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                  {p.photoUrl ? (
                    <img
                      src={getPhotoUrl(p.id)}
                      alt={p.name}
                      style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: "#f0f0f0",
                        borderRadius: 6,
                      }}
                    />
                  )}
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                  {p.name}
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                  {p.price.toFixed(2)} €
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f5f5f5" }}>
                  {p.category?.name ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}