import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import Register from './auth/Register';

export default function Home({ onSelectFeature, isLoggedIn }) {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [currentForm, setCurrentForm] = useState('login');
  const { login, register } = useAuth();

  const features = [
    {
      title: 'Post Optimiser',
      description: 'Transform your posts with AI-powered optimisation.',
      icon: '🎯',
      id: 'optimize'
    },
    {
      title: 'Reverse Engineer',
      description: 'Analyse successful posts to understand what makes them effective.',
      icon: '🔍',
      id: 'reverse'
    },
    {
      title: 'Power Words',
      description: 'Enhance your posts with impactful and engaging word choices.',
      icon: '💬',
      id: 'power'
    },
    {
      title: 'Evergreen Content',
      description: 'Generate timeless content tailored to your niche with AI-powered insights.',
      icon: '🌱',
      id: 'evergreen'
    },
    {
      title: 'Prompt Assistant',
      description: 'Generate structured prompts for AI image generation tools.',
      icon: '🤖',
      id: 'prompt'
    },
    {
      title: 'Image to Prompt',
      description: 'Convert images into detailed AI-ready prompts.',
      icon: '🎨',
      id: 'imageToPrompt'
    },
    {
      title: 'Image Generator',
      description: 'Create AI-generated images from your text prompts.',
      icon: '🖼️',
      id: 'imageGenerator'
    }
  ];

  const handleFeatureClick = (featureId) => {
    if (isLoggedIn) {
      console.log('Feature clicked:', featureId);
      onSelectFeature(featureId);
    }
  };

  const handleFormToggle = (formType) => {
    setCurrentForm(formType);
  };

  return (
    <div className="home-container">
      <div className="home-description">
        <h2>Welcome to EchoSphere</h2>
        <p>Your AI-powered platform for crafting engaging and impactful posts and prompts.</p>
      </div>
      
      {!isLoggedIn && (
        <div className="auth-section">
          <button 
            className="auth-toggle-button"
            onClick={() => setShowAuthForm(!showAuthForm)}
          >
            {showAuthForm ? 'Hide' : 'Login / Register'}
          </button>

          <div className={`auth-forms ${showAuthForm ? 'visible' : ''}`}>
            {currentForm === 'login' ? (
              <Login onToggleForm={() => handleFormToggle('register')} />
            ) : (
              <Register onToggleForm={() => handleFormToggle('login')} />
            )}
          </div>
        </div>
      )}
      
      <div className="feature-cards">
        {features.map(feature => (
          <div key={feature.id} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <button
              className="feature-button"
              disabled={!isLoggedIn}
              onClick={() => handleFeatureClick(feature.id)}
            >
              {isLoggedIn ? `Try ${feature.title}` : 'Login to Use'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 