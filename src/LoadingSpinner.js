import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ size }) {
  return <div className={`spinner${size === 'small' ? ' small' : ''}`}></div>;
} 