import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import { useAuth } from './AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Auth({ onClose }) {
  const [currentForm, setCurrentForm] = useState('login');
  const { setOnClose } = useAuth();
  
  useEffect(() => {
    setOnClose(() => onClose);
    return () => setOnClose(null);
  }, [onClose, setOnClose]);

  const handleFormToggle = (form) => {
    setCurrentForm(form);
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
        />
      )}
      
      {currentForm === 'register' && (
        <Register 
          onToggleForm={handleFormToggle}
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