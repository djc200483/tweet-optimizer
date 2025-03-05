import React from 'react';

export default function Home({ onSelectFeature, isLoggedIn }) {
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
    }
  ];

  const handleFeatureClick = (featureId) => {
    console.log('Feature clicked:', featureId);
    onSelectFeature(featureId);
  };

  return (
    <div className="home-container">
      <div className="home-description">
        <h2>Welcome to EchoSphere</h2>
        <p>Your AI-powered platform for crafting engaging and impactful posts and prompts.</p>
      </div>
      
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