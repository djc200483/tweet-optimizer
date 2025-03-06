import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PowerWords({
  powerText,
  setPowerText,
  isLoading,
  powerResults,
  setPowerResults,
  handlePowerAnalysis
}) {
  const [copiedWord, setCopiedWord] = useState(null);

  const handleWordCopy = (word) => {
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="feature-description">
          <p>Enhance your content's impact with AI-powered word suggestions. Our analysis identifies powerful words and phrases that can make your message more compelling and engaging.</p>
        </div>
        <textarea 
          placeholder="Paste text to analyse power words..."
          value={powerText}
          onChange={(e) => setPowerText(e.target.value)}
          rows="4"
          disabled={isLoading}
        />
        <div className="button-row">
          <button 
            className="submit-button"
            onClick={handlePowerAnalysis}
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="inline" /> : 'Analyse Power Words'}
          </button>
        </div>
      </div>

      {powerResults && powerResults.analysis && (
        <div className="analysis-container">
          <div className="analysis-card">
            <div className="analysis-content">
              <div className="analysis-item">
                <span className="analysis-label">Current Power Words:</span>
                <span className="analysis-value">{powerResults.analysis}</span>
              </div>
            </div>
          </div>

          <div className="power-words-suggestions">
            {powerResults.suggestions?.map((category, index) => (
              <div key={index} className="analysis-card">
                <div className="analysis-content">
                  <div className="analysis-item">
                    <span className="analysis-label">{category.category}</span>
                    <div className="word-chips">
                      {category.words?.map((word, wordIndex) => (
                        <span 
                          key={wordIndex} 
                          className="word-chip"
                          onClick={() => handleWordCopy(word)}
                          title={copiedWord === word ? 'Copied!' : 'Click to copy'}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                    <div className="example-usage">
                      <span className="analysis-label">Example:</span>
                      <span className="analysis-value">{category.example}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 