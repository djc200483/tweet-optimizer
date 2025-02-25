import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function Login({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, clearAuthError } = useAuth();

  // Debug log
  console.log('Login form state:', {
    email,
    isAdminEmail,
    adminEmail: process.env.REACT_APP_ADMIN_EMAIL,
    allEnv: process.env,
    nodeEnv: process.env.NODE_ENV
  });

  // Check if this is admin login attempt
  const isAdminEmail = process.env.REACT_APP_ADMIN_EMAIL && 
    email.toLowerCase() === process.env.REACT_APP_ADMIN_EMAIL.toLowerCase();

  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt:', { email, isAdmin: isAdminEmail });
      const result = await login(email, password);
      console.log('Login result:', result);
      if (!result.success) {
        setError(`Login failed: ${result.error || 'Unknown error'}`);
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(`Login error: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="auth-error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="auth-links">
        <button 
          onClick={() => onToggleForm('forgot')} 
          className="auth-switch-button"
        >
          Forgot Password?
        </button>
      </p>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button 
          onClick={() => onToggleForm('register')}
          className="auth-switch-button"
        >
          Register
        </button>
      </p>
    </div>
  );
} 