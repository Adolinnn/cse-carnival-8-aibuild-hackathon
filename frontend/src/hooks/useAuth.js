import { useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';

export function useAuth() {
  const [session, setSession] = useState(() => {
    return dataService.getSession();
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleSessionChange = (e) => {
      setSession(e.detail || null);
    };

    window.addEventListener('campusos:session-change', handleSessionChange);
    return () => {
      window.removeEventListener('campusos:session-change', handleSessionChange);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const result = await dataService.login(credentials);
      if (result.success && result.session) {
        setSession(result.session);
      }
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    dataService.clearSession();
    setSession(null);
  }, []);

  return {
    session,
    setSession,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === 'admin',
    tenant: session ? { dept: session.dept, semester: session.semester, section: session.section } : null,
    loading,
    login,
    logout,
  };
}
