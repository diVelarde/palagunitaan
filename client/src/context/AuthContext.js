import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [viewRole, setViewRoleState] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
      setViewRoleState(res.data.viewRole);
    } catch (err) {
      setUser(null);
      setViewRoleState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    setViewRoleState(null);
  };

  const setViewRole = async (role) => {
    const res = await api.patch('/api/auth/view-role', { viewRole: role });
    setViewRoleState(res.data.viewRole);
  };

  const value = { user, viewRole, loading, login, logout, setViewRole, refresh };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
