import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL parameters
  const token = new URLSearchParams(location.search).get('token');

  console.log('ResetPassword component mounted:', {
    hasToken: !!token,
    tokenLength: token?.length,
    pathname: location.pathname,
    search: location.search
  });

  useEffect(() => {
    // Verify token when component mounts
    const verifyToken = async () => {
      if (!token) {
        console.log('No reset token provided');
        setError('No reset token provided');
        return;
      }

      try {
        console.log('Verifying token:', {
          apiUrl: process.env.REACT_APP_API_URL,
          token: token.substring(0, 20) + '...' // Log first 20 chars for safety
        });

        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/verify-reset-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        console.log('Token verification response:', {
          status: response.status,
          ok: response.ok,
          data
        });

        if (response.ok && data.valid) {
          setIsTokenValid(true);
        } else {
          setError('Invalid or expired reset token');
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setError('Error verifying reset token');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Password successfully reset');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-form">
        <div className="auth-error">No reset token provided</div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="auth-form">
        <div className="auth-error">{error || 'Verifying reset token...'}</div>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
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
            minLength={8}
          />
        </div>

        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
} 