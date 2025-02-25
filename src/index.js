import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Add error boundary
if (process.env.NODE_ENV !== 'production') {
  console.log('API URL:', process.env.REACT_APP_API_URL);
  console.log('Admin Email:', process.env.REACT_APP_ADMIN_EMAIL);
  
  if (!process.env.REACT_APP_ADMIN_EMAIL) {
    console.warn('Warning: REACT_APP_ADMIN_EMAIL is not set');
  }
}

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', { message, source, lineno, colno, error });
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
