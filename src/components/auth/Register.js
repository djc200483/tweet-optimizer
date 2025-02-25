import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export default function Register({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, clearAuthError } = useAuth();

  // Clear any auth errors when component mounts or unmounts
  useEffect(() => {
    clearAuthError();
    return () => clearAuthError();
  }, [clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (!xHandle.startsWith('@')) {
      setXHandle('@' + xHandle);
    }

    setIsLoading(true);

    try {
      const result = await register(email, password, xHandle);
      if (!result.success) {
        setError(result.error || 'Registration failed');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('An error occurred during registration');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
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
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="xHandle">X Handle (e.g. @username)</label>
          <input
            type="text"
            id="xHandle"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="@"
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button onClick={onToggleForm} className="auth-switch-button">
          Login
        </button>
      </p>
    </div>
  );
} 