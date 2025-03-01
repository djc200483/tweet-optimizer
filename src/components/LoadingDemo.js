import React, { useState } from 'react';
import './LoadingDemo.css';

const LoadingSpinner = ({ size = 'medium', color = '#1da1f2', text }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div className="loading-container">
      <div 
        className="loading-spinner"
        style={{ 
          width: sizeMap[size], 
          height: sizeMap[size],
          borderTopColor: color 
        }}
      />
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default function LoadingDemo() {
  const [showSpinners, setShowSpinners] = useState(true);

  return (
    <div className="demo-container">
      <h2>Loading Spinner Variations</h2>
      <button 
        className="toggle-button"
        onClick={() => setShowSpinners(prev => !prev)}
      >
        {showSpinners ? 'Hide Spinners' : 'Show Spinners'}
      </button>

      {showSpinners && (
        <div className="spinners-grid">
          <div className="spinner-example">
            <h3>Small</h3>
            <LoadingSpinner size="small" />
          </div>

          <div className="spinner-example">
            <h3>Medium (Default)</h3>
            <LoadingSpinner size="medium" text="Loading..." />
          </div>

          <div className="spinner-example">
            <h3>Large</h3>
            <LoadingSpinner size="large" text="Processing your request..." />
          </div>

          <div className="spinner-example">
            <h3>Custom Color</h3>
            <LoadingSpinner size="medium" color="#FF1493" text="Custom pink spinner" />
          </div>
        </div>
      )}
    </div>
  );
} 