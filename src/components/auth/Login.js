import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

export default function Login({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, clearAuthError } = useAuth();

  // Check if this is admin login attempt
  const isAdminEmail = process.env.REACT_APP_ADMIN_EMAIL && 
    email.toLowerCase() === process.env.REACT_APP_ADMIN_EMAIL.toLowerCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Login attempt:', { email, isAdmin: isAdminEmail });
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection failed. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Login'}
        </button>
      </form>

      <p className="auth-links">
        <button 
          onClick={() => onToggleForm('forgot')} 
          className="auth-switch-button"
          disabled={isLoading}
        >
          Forgot Password?
        </button>
      </p>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button 
          onClick={() => onToggleForm('register')}
          className="auth-switch-button"
          disabled={isLoading}
        >
          Register
        </button>
      </p>
    </div>
  );
} 