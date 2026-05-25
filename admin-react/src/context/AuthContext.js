import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    // userData = { token, id, nom, email, role }
    const { token, ...userInfo } = userData;

    // Sauvegarder le token JWT pour les requêtes API
    if (token) {
      localStorage.setItem('token', token);
    }

    // Sauvegarder les infos utilisateur
    setUser(userInfo);
    localStorage.setItem('user', JSON.stringify(userInfo));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // ← important : supprimer le token aussi
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export default AuthContext;