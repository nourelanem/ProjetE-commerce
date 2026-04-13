const BASE_URL = "http://localhost:8080";

export const getProducts = () => fetch(`${BASE_URL}/products`).then(r => r.json());
export const getProduct = (id) => fetch(`${BASE_URL}/products/${id}`).then(r => r.json());
export const createProduct = (data) => fetch(`${BASE_URL}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const updateProduct = (id, data) => fetch(`${BASE_URL}/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteProduct = (id) => fetch(`${BASE_URL}/products/${id}`, { method: "DELETE" });
export const uploadProductPhoto = (id, file) => { const form = new FormData(); form.append("file", file); return fetch(`${BASE_URL}/products/${id}/photo`, { method: "POST", body: form }).then(r => r.json()); };
export const getPhotoUrl = (id) => `${BASE_URL}/products/${id}/photo`;

export const getCategories = () => fetch(`${BASE_URL}/categories`).then(r => r.json());
export const createCategory = (data) => fetch(`${BASE_URL}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const updateCategory = (id, data) => fetch(`${BASE_URL}/categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteCategory = (id) => fetch(`${BASE_URL}/categories/${id}`, { method: "DELETE" });

export const getSuppliers = () => fetch(`${BASE_URL}/suppliers`).then(r => r.json());
export const createSupplier = (data) => fetch(`${BASE_URL}/suppliers`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const updateSupplier = (id, data) => fetch(`${BASE_URL}/suppliers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json());
export const deleteSupplier = (id) => fetch(`${BASE_URL}/suppliers/${id}`, { method: "DELETE" });

export const login = (email, password) => fetch(`${BASE_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }).then(r => r.json());
export const register = (nom, email, password) => fetch(`${BASE_URL}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom, email, password }) }).then(r => r.json());

export const getUsers = () => fetch(`${BASE_URL}/users`).then(r => r.json());
export const changeUserRole = (id, nom) => fetch(`${BASE_URL}/users/${id}/role`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) }).then(r => r.json());
export const deleteUser = (id) => fetch(`${BASE_URL}/users/${id}`, { method: "DELETE" });

export const getPanier = (userId) => fetch(`${BASE_URL}/panier/${userId}`).then(r => r.json());
export const ajouterAuPanier = (userId, productId, quantite = 1) => fetch(`${BASE_URL}/panier/${userId}/ajouter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, quantite }) }).then(r => r.json());
export const supprimerLigne = (ligneId) => fetch(`${BASE_URL}/panier/ligne/${ligneId}`, { method: "DELETE" });
export const commander = (userId) => fetch(`${BASE_URL}/panier/${userId}/commander`, { method: "POST" }).then(r => r.json());