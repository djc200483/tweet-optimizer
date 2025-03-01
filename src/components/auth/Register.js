import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../LoadingSpinner';

export default function Register({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    console.log('Register form submitted:', { email, xHandle });

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
      console.log('Attempting registration...');
      const result = await register(
        email,
        password,
        xHandle.startsWith('@') ? xHandle : `@${xHandle}`
      );

      console.log('Registration result:', result);
      if (!result.success) {
        setError(result.error || 'Registration failed');
      } else {
        console.log('Registration successful');
        setSuccess('Registration successful! Redirecting to login...');
        // Wait 2 seconds before redirecting to login
        setTimeout(() => {
          onToggleForm('login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Register</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
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
          <label htmlFor="xHandle">X Handle (e.g. @username)</label>
          <input
            type="text"
            id="xHandle"
            value={xHandle}
            onChange={(e) => setXHandle(e.target.value)}
            placeholder="@"
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
            minLength={6}
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Register'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{' '}
        <button 
          onClick={() => onToggleForm('login')} 
          className="auth-switch-button"
          disabled={isLoading}
        >
          Login
        </button>
      </p>
    </div>
  );
} 