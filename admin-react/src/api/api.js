const BASE_URL = "http://localhost:8080";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const authHeadersFormData = () => ({
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const safeJson = async (response) => {
  const text = await response.text();
  if (!text || text.trim() === "") return null;
  try { return JSON.parse(text); } catch { return null; }
};

export const getProducts = () => fetch(`${BASE_URL}/products`).then(safeJson).then(d => d || []);
export const getProduct = (id) => fetch(`${BASE_URL}/products/${id}`).then(safeJson);
export const createProduct = (data) => fetch(`${BASE_URL}/products`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const updateProduct = (id, data) => fetch(`${BASE_URL}/products/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const deleteProduct = (id) => fetch(`${BASE_URL}/products/${id}`, { method: "DELETE", headers: authHeaders() });
export const uploadProductPhoto = (id, file) => { const form = new FormData(); form.append("file", file); return fetch(`${BASE_URL}/products/${id}/photo`, { method: "POST", headers: authHeadersFormData(), body: form }).then(safeJson); };
export const getPhotoUrl = (id) => `${BASE_URL}/products/${id}/photo`;

export const getCategories = () => fetch(`${BASE_URL}/categories`).then(safeJson).then(d => d || []);
export const createCategory = (data) => fetch(`${BASE_URL}/categories`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const updateCategory = (id, data) => fetch(`${BASE_URL}/categories/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const deleteCategory = (id) => fetch(`${BASE_URL}/categories/${id}`, { method: "DELETE", headers: authHeaders() });

export const getSuppliers = async () => {
  const response = await fetch(`${BASE_URL}/suppliers`, { headers: authHeaders() });
  const data = await safeJson(response);
  if (!response.ok) {
    const message = response.status === 403
      ? "Acces refuse aux fournisseurs. Reconnectez-vous avec un compte admin."
      : "Impossible de charger les fournisseurs.";
    throw new Error(data?.error || message);
  }
  return data || [];
};
export const createSupplier = (data) => fetch(`${BASE_URL}/suppliers`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const updateSupplier = (id, data) => fetch(`${BASE_URL}/suppliers/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }).then(safeJson);
export const deleteSupplier = (id) => fetch(`${BASE_URL}/suppliers/${id}`, { method: "DELETE", headers: authHeaders() });

export const login = (email, password) => fetch(`${BASE_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then(safeJson);
export const register = (nom, email, password) => fetch(`${BASE_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom, email, password }) }).then(safeJson);
export const verifyEmail = (token) => fetch(`${BASE_URL}/auth/verify?token=${encodeURIComponent(token)}`).then(safeJson);
export const resendVerification = (email) => fetch(`${BASE_URL}/auth/resend-verification`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).then(safeJson);

export const getUsers = () => fetch(`${BASE_URL}/users`, { headers: authHeaders() }).then(safeJson).then(d => d || []);
export const changeUserRole = (id, nom) => fetch(`${BASE_URL}/users/${id}/role`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ nom }) }).then(safeJson);
export const deleteUser = (id) => fetch(`${BASE_URL}/users/${id}`, { method: "DELETE", headers: authHeaders() });

export const getPanier = (userId) => fetch(`${BASE_URL}/panier/${userId}`, { headers: authHeaders() }).then(safeJson).then(d => d || null);
export const getCommandes = (userId) => fetch(`${BASE_URL}/panier/${userId}/commandes`, { headers: authHeaders() }).then(safeJson).then(d => d || []);
export const ajouterAuPanier = (userId, productId, quantite = 1) => fetch(`${BASE_URL}/panier/${userId}/ajouter`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ productId, quantite }) }).then(safeJson);
export const supprimerLigne = (ligneId) => fetch(`${BASE_URL}/panier/ligne/${ligneId}`, { method: "DELETE", headers: authHeaders() });
export const commander = (userId) => fetch(`${BASE_URL}/panier/${userId}/commander`, { method: "POST", headers: authHeaders() }).then(safeJson);
