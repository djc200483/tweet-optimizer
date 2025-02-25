import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function ForgotPassword({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { clearAuthError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('If an account exists with this email, you will receive reset instructions.');
        setTimeout(() => onToggleForm(), 3000); // Return to login after 3 seconds
      } else {
        setError(data.error || 'Failed to process request');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError('An error occurred');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
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
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Reset Password'}
        </button>
      </form>

      <p className="auth-switch">
        Remember your password?{' '}
        <button onClick={onToggleForm} className="auth-switch-button">
          Back to Login
        </button>
      </p>
    </div>
  );
} 