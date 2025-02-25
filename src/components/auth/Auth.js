import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';

export default function Auth() {
  const [currentForm, setCurrentForm] = useState('login');

  const handleFormToggle = (form) => {
    console.log('Toggling form to:', form);
    setCurrentForm(form);
  };

  return (
    <>
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
    </>
  );
} 