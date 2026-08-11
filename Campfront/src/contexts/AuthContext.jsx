import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        // Save token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.preferredLanguage) {
          localStorage.setItem('app_language', userData.preferredLanguage);
          window.dispatchEvent(new CustomEvent('language_changed', { detail: userData.preferredLanguage }));
        }

        setUser(userData);
        
        return { success: true };
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
