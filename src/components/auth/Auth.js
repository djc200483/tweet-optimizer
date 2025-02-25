import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

export default function Auth() {
  const [currentForm, setCurrentForm] = useState('login');

  const handleFormToggle = (form) => {
    setCurrentForm(form);
  };

  return (
    <>
      {currentForm === 'login' && (
        <Login onToggleForm={handleFormToggle} />
      )}
      {currentForm === 'register' && (
        <Register onToggleForm={handleFormToggle} />
      )}
      {currentForm === 'forgot' && (
        <ForgotPassword onToggleForm={handleFormToggle} />
      )}
    </>
  );
} 