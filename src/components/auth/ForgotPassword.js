import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';

export default function ForgotPassword({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        setSuccess(data.message || 'If an account exists with this email, a password reset link will be sent.');
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      setError('An error occurred while processing your request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-content">
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

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner /> : 'Send Reset Instructions'}
        </button>
      </form>

      <p className="auth-switch">
        Remember your password?{' '}
        <button 
          onClick={() => onToggleForm('login')}
          className="auth-switch-button"
          disabled={isLoading}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
} 