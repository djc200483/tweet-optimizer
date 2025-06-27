import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Auth({ onClose }) {
  const [currentForm, setCurrentForm] = useState('login');
  const { setOnClose, login } = useAuth();
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [x_handle, setXHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setOnClose(() => onClose);
    return () => setOnClose(null);
  }, [onClose, setOnClose]);

  const handleFormToggle = (form) => {
    setCurrentForm(form);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please try again.');
        return;
      }
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
      setError('Connection failed. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
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
      
      {currentForm === 'login' && (
        <Login 
          onToggleForm={handleFormToggle}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleSubmit}
          error={error}
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
          error={error}
        />
      )}
      
      {currentForm === 'forgot' && (
        <div className="auth-form">
          <h2>Forgot Password</h2>
          <ForgotPassword onToggleForm={() => handleFormToggle('login')} />
        </div>
      )}
    </div>
  );
} 