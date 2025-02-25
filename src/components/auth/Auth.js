import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

export default function Auth({ onClose }) {
  const [currentForm, setCurrentForm] = useState('login');
  console.log('Current form:', currentForm);

  const handleFormToggle = (form) => {
    console.log('Toggling form to:', form);
    setCurrentForm(form);
  };

  const handleSuccess = () => {
    if (onClose) onClose();
  };

  return (
    <div className="auth-container">
      {console.log('Current form:', currentForm)}
      {currentForm === 'login' && (
        <Login onToggleForm={handleFormToggle} />
      )}
      {currentForm === 'register' && (
        <Register onToggleForm={handleFormToggle} />
      )}
      {currentForm === 'forgot' && (
        <ForgotPassword onToggleForm={handleFormToggle} />
      )}
    </div>
  );
} 