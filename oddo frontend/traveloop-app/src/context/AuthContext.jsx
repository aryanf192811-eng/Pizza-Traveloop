import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fix B helpers — resolve relative photo URLs to absolute
  const resolvePhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url; // already absolute
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    return `${base}${url}`;
  };

  const normalizeUser = (userData) => ({
    ...userData,
    photo_url: resolvePhotoUrl(userData?.photo_url),
  });

  useEffect(() => {
    const token = localStorage.getItem('traveloop_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data: res }) => setUser(normalizeUser(res.data)))
      .catch(() => { localStorage.removeItem('traveloop_token'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('traveloop_token', token);
    setUser(normalizeUser(userData));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('traveloop_token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((data) => {
    setUser(prev => normalizeUser({ ...prev, ...data }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
