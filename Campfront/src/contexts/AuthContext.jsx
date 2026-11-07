import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { authApi } from '../api';
import { getSessionInactivityTimeout } from '../utils/sessionSecurity';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastRecordedRef = useRef(Date.now());

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (!localStorage.getItem('camp_last_active_time')) {
            localStorage.setItem('camp_last_active_time', Date.now().toString());
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('camp_last_active_time');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('camp_last_active_time');
    setUser(null);
  }, []);

  // Record user activity across clicks, mouse, keyboard, touch, scroll
  const recordActivity = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastRecordedRef.current > 3000) {
      lastRecordedRef.current = now;
      localStorage.setItem('camp_last_active_time', now.toString());
    }
  }, [user]);

  // Listen to user interaction events to refresh idle timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleUserInteraction = () => {
      recordActivity();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, { passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction);
      });
    };
  }, [user, recordActivity]);

  // Multi-tab logout sync
  useEffect(() => {
    const handleStorageEvent = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Periodic inactivity checker:
  // - Admin & Coordinator with Finance role: 5 minutes idle -> auto logout
  // - Standard Coordinator: 15 minutes idle -> auto logout
  // - Participant: 5 hours idle -> auto logout
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastActiveStr = localStorage.getItem('camp_last_active_time');
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : now;
      const elapsed = now - lastActive;

      const timeoutMs = getSessionInactivityTimeout(user);

      if (elapsed >= timeoutMs) {
        // Save user info for quick re-login on the standard login form
        if (user.email) {
          sessionStorage.setItem('timed_out_email', user.email);
          sessionStorage.setItem('timed_out_portal', user.role !== 'PARTICIPANT' ? 'COORDINATOR_ADMIN' : 'PARTICIPANT');
        }

        // Automatic logout
        logout();

        // Redirect directly to the login form
        window.location.href = '/login';
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user, logout]);

  const login = async (email, password, portal) => {
    try {
      const payload = { email, password };
      if (portal) {
        payload.portal = portal;
      }
      const response = await authApi.login(payload);
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        // Save token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('camp_last_active_time', Date.now().toString());
        sessionStorage.removeItem('timed_out_email');
        sessionStorage.removeItem('timed_out_portal');
        
        if (userData.preferredLanguage) {
          localStorage.setItem('app_language', userData.preferredLanguage);
          window.dispatchEvent(new CustomEvent('language_changed', { detail: userData.preferredLanguage }));
        }

        setUser(userData);
        lastRecordedRef.current = Date.now();
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      if (response.data.success) {
        return { success: true, message: 'Registration successful!' };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errData = error.response?.data;
      return {
        success: false,
        message: errData?.message || 'Registration failed. Please try again.',
        validationErrors: errData?.validationErrors || null,
      };
    }
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const updatedUser = { ...(prevUser || {}), ...updatedData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // Helper functions for role checking
  const isAdmin = () => user?.role === 'ADMINISTRATOR';
  const isCoordinator = () => user?.role === 'COORDINATOR';
  const isParticipant = () => user?.role === 'PARTICIPANT';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAdmin: isAdmin(),
    isCoordinator: isCoordinator(),
    isParticipant: isParticipant(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
