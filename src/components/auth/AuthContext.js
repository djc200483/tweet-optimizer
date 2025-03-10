import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [onClose, setOnClose] = useState(null);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        console.log('Verifying token:', token);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          setAuthError('Session expired. Please login again.');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        setAuthError('Authentication error. Please login again.');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      setIsAuthLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setAuthError(null);
        return { success: true };
      } else {
        setAuthError(data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async (email, password, x_handle) => {
    try {
      console.log('Starting registration for:', { email, x_handle });
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, x_handle })
      });

      const data = await response.json();
      console.log('Registration response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store the token and user data
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        logout, 
        isAuthLoading,
        authError,
        clearAuthError,
        isAdmin: user?.is_admin,
        onClose,
        setOnClose
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 