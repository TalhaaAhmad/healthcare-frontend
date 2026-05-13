'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface AuthUser {
  email: string;
  full_name: string;
  user_type?: string;
  roles?: string[];
}

export interface AuthState {
  user: AuthUser | null;
  patientId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache session check for 30 seconds to reduce API calls
const SESSION_CACHE_MS = 30000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    patientId: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const lastCheckRef = useRef<number>(0);
  const checkingRef = useRef<boolean>(false);

  const checkSession = useCallback(async (force = false) => {
    // Skip if already checking or cache is fresh
    if (checkingRef.current) return;
    const now = Date.now();
    if (!force && now - lastCheckRef.current < SESSION_CACHE_MS) return;

    checkingRef.current = true;
    try {
      const res = await fetch('/api/frappe/method/frappe.auth.get_logged_user', {
        credentials: 'include',
      });

      if (!res.ok) {
        setState({
          user: null,
          patientId: null,
          isLoading: false,
          isAuthenticated: false,
        });
        lastCheckRef.current = now;
        return;
      }

      const userData = await res.json();
      const email = userData.message;

      // Fetch user details including roles
      const userRes = await fetch(`/api/frappe/resource/User/${encodeURIComponent(email)}`, {
        credentials: 'include',
      });

      if (!userRes.ok) {
        setState({
          user: null,
          patientId: null,
          isLoading: false,
          isAuthenticated: false,
        });
        lastCheckRef.current = now;
        return;
      }

      const userDetails = await userRes.json();
      const user = userDetails.data;
      const roles = user.roles?.map((r: any) => r.role) || [];

      let patientId = null;

      // Use API Key auth for DocType lookups (the logged-in user may not have
      // permission to read Patient/Healthcare Practitioner via REST API).
      // We pass the email as a query param so the server-side proxy can
      // switch to API Key auth for these read-only lookups.
      const lookupRes = await fetch(
        `/api/frappe/auth/lookup?email=${encodeURIComponent(email)}`,
        { credentials: 'include' }
      );
      if (lookupRes.ok) {
        const lookupData = await lookupRes.json();
        patientId = lookupData.patientId || null;
      }

      setState({
        user: {
          email: user.email,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          user_type: user.user_type,
          roles,
        },
        patientId,
        isLoading: false,
        isAuthenticated: true,
      });
      lastCheckRef.current = now;
    } catch {
      setState({
        user: null,
        patientId: null,
        
        isLoading: false,
        isAuthenticated: false,
      });
      lastCheckRef.current = now;
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/frappe/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Refresh session state after login (force=true to bypass cache)
      await checkSession(true);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async function logout() {
    try {
      await fetch('/api/frappe/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setState({
        user: null,
        patientId: null,
        
        isLoading: false,
        isAuthenticated: false,
      });
      window.location.href = '/login';
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
