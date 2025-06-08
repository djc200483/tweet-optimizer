import React, { useState } from 'react';
import RandomGallery from './RandomGallery';

export default function Home({ onSelectFeature, isLoggedIn }) {
  const [activeTab, setActiveTab] = useState('imagery');
  const [expandedCard, setExpandedCard] = useState(null);

  const writtenFeatures = [
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
    }
  ];

  const imageryFeatures = [
    {
      title: 'Image Generator',
      description: 'Create AI-generated images from your text prompts.',
      icon: '🖼️',
      id: 'imageGenerator'
    },
    {
      title: 'Image to Prompt',
      description: 'Convert images into detailed AI-ready prompts.',
      icon: '🎨',
      id: 'imageToPrompt'
    },
    {
      title: 'Prompt Assistant',
      description: 'Generate structured prompts for AI image generation tools.',
      icon: '🤖',
      id: 'prompt'
    }
  ];

  const handleFeatureClick = (featureId) => {
    console.log('Feature clicked:', featureId);
    onSelectFeature(featureId);
  };

  const handleCardClick = (featureId) => {
    setExpandedCard(expandedCard === featureId ? null : featureId);
  };

  const renderFeatureCards = (features, isCollapsible = false) => (
    <div className={`feature-cards ${isCollapsible ? 'collapsible-cards' : ''}`}>
      {features.map(feature => (
        <div 
          key={feature.id} 
          className={`feature-card ${isCollapsible ? 'collapsible' : ''} ${expandedCard === feature.id ? 'expanded' : ''}`}
          onClick={() => isCollapsible && handleCardClick(feature.id)}
        >
          <div className="feature-card-header">
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            {isCollapsible && (
              <span className="expand-icon">{expandedCard === feature.id ? '−' : '+'}</span>
            )}
          </div>
          <div className="feature-card-content">
            {feature.description && <p>{feature.description}</p>}
            <button
              className="feature-button"
              disabled={!isLoggedIn}
              onClick={(e) => {
                e.stopPropagation();
                handleFeatureClick(feature.id);
              }}
            >
              {isLoggedIn ? `Try ${feature.title}` : 'Login to Use'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-container">
      <div className="home-description">
        <h2>Welcome to EchoSphere</h2>
        <p>Your AI-powered platform for crafting engaging and impactful posts and prompts.</p>
      </div>
      
      <div className="content-tabs">
        <button 
          className={`tab-button ${activeTab === 'imagery' ? 'active' : ''}`}
          onClick={() => setActiveTab('imagery')}
        >
          Visual Tools
        </button>
        <button 
          className={`tab-button ${activeTab === 'written' ? 'active' : ''}`}
          onClick={() => setActiveTab('written')}
        >
          Writing Tools
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'imagery' ? (
          <>
            <div className="tab-description">
              <h3>Create and optimize images using advanced AI technology</h3>
            </div>
            <div className="visual-tools-flex">
              {renderFeatureCards(imageryFeatures, true)}
              <RandomGallery />
            </div>
          </>
        ) : (
          <>
            <div className="tab-description">
              <h3>Enhance your written content with our AI-powered writing tools</h3>
            </div>
            <div className="writing-tools-flex">
              {renderFeatureCards(writtenFeatures, true)}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 