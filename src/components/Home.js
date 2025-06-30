import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RandomGallery from './RandomGallery';
import FeaturedGallery from './FeaturedGallery';
import FloatingStars from './FloatingStars';

export default function Home({ onSelectFeature, isLoggedIn, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'imagery');
  const [expandedCard, setExpandedCard] = useState(null);
  const [hasLoggedOutUserClicked, setHasLoggedOutUserClicked] = useState(false);
  const navigate = useNavigate();

  const writtenFeatures = [
    {
      title: 'Post Optimiser',
      description: 'Transform your posts with AI-powered optimisation.',
      id: 'optimize'
    },
    {
      title: 'Reverse Engineer',
      description: 'Analyse successful posts to understand what makes them effective.',
      id: 'reverse'
    },
    {
      title: 'Power Words',
      description: 'Enhance your posts with impactful and engaging word choices.',
      id: 'power'
    },
    {
      title: 'Evergreen Content',
      description: 'Generate timeless content tailored to your niche with AI-powered insights.',
      id: 'evergreen'
    }
  ];

  const imageryFeatures = [
    // {
    //   title: 'Image Generator',
    //   description: 'Create AI-generated images from your text prompts.',
    //   id: 'imageGenerator'
    // },
    // {
    //   title: 'Image to Prompt',
    //   description: 'Convert images into detailed AI-ready prompts.',
    //   id: 'imageToPrompt'
    // },
    // {
    //   title: 'Prompt Assistant',
    //   description: 'Generate structured prompts for AI image generation tools.',
    //   id: 'prompt'
    // }
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
              {isLoggedIn
                ? (feature.id === 'imageGenerator' ? 'Generate'
                  : feature.id === 'imageToPrompt' ? 'Add Image'
                  : `Try ${feature.title}`)
                : 'Login to Use'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-container">
      <FloatingStars />
      <div className="home-description">
        <h2 style={{ fontSize: '2.8rem' }}>Welcome to EchoSphere</h2>
        <p>An all-in-one AI platform for creating eye-catching images, engaging videos, and impactful written content</p>
      </div>
      
      <div className="tab-content">
        {activeTab === 'imagery' ? (
          <>
            <div className="tab-description">
              <button
                className="tab-button active"
                onClick={() => {
                  if (isLoggedIn) {
                    navigate('/image-generator');
                  } else {
                    if (hasLoggedOutUserClicked) {
                      onSelectFeature('auth');
                    } else {
                      setHasLoggedOutUserClicked(true);
                    }
                  }
                }}
              >
                {!isLoggedIn && hasLoggedOutUserClicked ? 'Log in' : 'Generate'}
              </button>
            </div>
            <div className="visual-tools-flex">
              {renderFeatureCards(imageryFeatures, true)}
            </div>
            <div className="featured-gallery-svg-title">
              <svg width="auto" height="40" viewBox="0 0 400 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="featuredGradient" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00c2ff"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                <text x="0" y="30" font-family="inherit" font-weight="600" font-size="30" fill="url(#featuredGradient)" alignment-baseline="middle">Featured Images</text>
              </svg>
            </div>
            <FeaturedGallery />
            <div className="gallery-svg-title">
              <svg width="auto" height="40" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="galleryGradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00c2ff"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                <text x="0" y="30" font-family="inherit" font-weight="600" font-size="30" fill="url(#galleryGradient)" alignment-baseline="middle">Gallery</text>
              </svg>
            </div>
            <RandomGallery />
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