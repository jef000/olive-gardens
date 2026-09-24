import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { refreshSession } from './api';
import csrfManager from './csrfManager';
import tokenManager from './tokenManager';
import type { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  mfaChallenge: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMFA: (code: string, backupCode?: boolean) => Promise<void>;
  cancelMFA: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mfaChallenge, setMfaChallenge] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const setAuthenticatedUser = useCallback((userData: User, mustChangePasswordFlag?: boolean, shouldNavigate = true) => {
    if (userData.role !== 'admin' && userData.role !== 'moderator') {
      void api.post('/auth/logout').catch(() => undefined);
      tokenManager.clearTokens();
      csrfManager.clearToken();
      localStorage.removeItem('admin_user');
      throw new Error('This account does not have administrator access.');
    }
    const requiresPasswordChange = Boolean(mustChangePasswordFlag || userData.must_change_password);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setUser(userData);
    setMustChangePassword(requiresPasswordChange);
    tokenManager.markAuthenticated();
    tokenManager.startRefreshTimer(refreshSession);
    if (!shouldNavigate) return;
    if (requiresPasswordChange) {
      navigate('/change-password', { state: { message: 'You must change your temporary password before continuing.', isRequired: true } });
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      try {
        let response;
        try {
          response = await api.get<AuthResponse>('/auth/me');
        } catch {
          await refreshSession();
          response = await api.get<AuthResponse>('/auth/me');
        }
        if (active) setAuthenticatedUser(response.data.data.user, undefined, false);
      } catch {
        if (active) {
          localStorage.removeItem('admin_user');
          setUser(null);
          setMustChangePassword(false);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void checkAuth();
    return () => { active = false; tokenManager.stopRefreshTimer(); };
  }, [setAuthenticatedUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    const data = response.data.data;
    if (data.mfa_required && data.mfa_token) {
      setMfaChallenge(data.mfa_token);
      return;
    }
    setAuthenticatedUser(data.user, data.must_change_password);
  }, [setAuthenticatedUser]);

  const verifyMFA = useCallback(async (code: string, backupCode = false) => {
    if (!mfaChallenge) throw new Error('MFA challenge has expired. Please sign in again.');
    const endpoint = backupCode ? '/auth/mfa/backup-code' : '/auth/mfa/validate';
    const body = backupCode ? { mfa_token: mfaChallenge, code } : { mfa_token: mfaChallenge, token: code };
    const response = await api.post<AuthResponse>(endpoint, body);
    setMfaChallenge(null);
    setAuthenticatedUser(response.data.data.user, response.data.data.must_change_password);
  }, [mfaChallenge, setAuthenticatedUser]);

  const cancelMFA = useCallback(() => {
    setMfaChallenge(null);
  }, []);

  const logout = useCallback(() => {
    // Fire the request before clearing state: the axios interceptor needs the
    // in-memory CSRF token to authorize the logout call.
    void api
      .post('/auth/logout')
      .catch(() => undefined)
      .finally(() => {
        tokenManager.clearTokens();
        csrfManager.clearToken();
        localStorage.removeItem('admin_user');
        setUser(null);
        setMfaChallenge(null);
        setMustChangePassword(false);
        navigate('/login');
      });
  }, [navigate]);

  return <AuthContext.Provider value={{ user, mfaChallenge, mustChangePassword, login, verifyMFA, cancelMFA, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
