import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Auth({ onClose }) {
  const [currentForm, setCurrentForm] = useState('login');
  const { setOnClose } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [x_handle, setXHandle] = useState('');
  
  useEffect(() => {
    setOnClose(() => onClose);
    return () => setOnClose(null);
  }, [onClose, setOnClose]);

  const handleFormToggle = (form) => {
    console.log('Toggling form to:', form);
    setCurrentForm(form);
    setError(''); // Clear any existing errors when switching forms
  };

  const handleSuccess = () => {
    if (onClose) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/${currentForm === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, x_handle }),
      });

      // Add timeout for slow connections
      const timeoutId = setTimeout(() => {
        setError('Request timed out. Please check your connection and try again.');
      }, 15000);

      const data = await response.json();
      clearTimeout(timeoutId);

      if (!response.ok) {
        setError(data.error || 'Authentication failed. Please try again.');
        return;
      }
      handleSuccess();
    } catch (error) {
      console.error('Auth error:', error);
      // More descriptive error for iOS users
      setError(
        'Connection failed. Please check your internet connection and try again. ' +
        'If the problem persists, try refreshing the page.'
      );
    }
  };

  return (
    <div className="auth-container">
      <button 
        className="back-home-button"
        onClick={onClose}
      >
        ← Back to Home
      </button>
      {error && <div className="auth-error">{error}</div>}
      {currentForm === 'login' && (
        <Login 
          onToggleForm={handleFormToggle}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleSubmit}
        />
      )}
      {currentForm === 'register' && (
        <Register 
          onToggleForm={handleFormToggle}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          x_handle={x_handle}
          setXHandle={setXHandle}
          onSubmit={handleSubmit}
        />
      )}
      {currentForm === 'forgot' && (
        <ForgotPassword onToggleForm={handleFormToggle} />
      )}
    </div>
  );
} 