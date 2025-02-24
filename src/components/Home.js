import React from 'react';

export default function Home({ onSelectFeature }) {
  return (
    <div className="home-container">
      <div className="home-description">
        <h2>Welcome to EchoSphere</h2>
        <p>Your AI-powered platform for crafting engaging and impactful posts.</p>
      </div>
      
      <div className="feature-cards">
        <div 
          className="feature-card"
          onClick={() => onSelectFeature('optimize')}
        >
          <h2>Post Optimiser</h2>
          <p>Transform your old posts with AI-powered tone and style adjustments.</p>
          <button className="feature-button">Get Started</button>
        </div>

        <div 
          className="feature-card"
          onClick={() => onSelectFeature('reverse')}
        >
          <h2>Reverse Engineer</h2>
          <p>Analyse successful posts to understand what makes them effective.</p>
          <button className="feature-button">Get Started</button>
        </div>

        <div 
          className="feature-card"
          onClick={() => onSelectFeature('power')}
        >
          <h2>Power Words</h2>
          <p>Enhance your posts with impactful and engaging word choices.</p>
          <button className="feature-button">Get Started</button>
        </div>

        <div 
          className="feature-card"
          onClick={() => onSelectFeature('prompt')}
        >
          <h2>Prompt Assistant</h2>
          <p>Generate structured prompts for AI image generation tools.</p>
          <button className="feature-button">Get Started</button>
        </div>
      </div>
    </div>
  );
} 