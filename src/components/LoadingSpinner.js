import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'default', className = '' }) => {
  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner loading-spinner-${size}`} />
    </div>
  );
};

export default LoadingSpinner; 