import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem('memora_user')||'null'); } catch{ return null; } });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        localStorage.setItem('memora_token', data.token);
        localStorage.setItem('memora_user',  JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
    } catch(e) {
      return { success:false, message: e.response?.data?.message || 'Login failed' };
    } finally { setLoading(false); }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      if (data.success) {
        localStorage.setItem('memora_token', data.token);
        localStorage.setItem('memora_user',  JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
    } catch(e) {
      return { success:false, message: e.response?.data?.message || 'Registration failed' };
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem('memora_token');
    localStorage.removeItem('memora_user');
    setUser(null);
    window.location.href = '/';
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
