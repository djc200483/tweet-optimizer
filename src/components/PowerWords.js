import React from 'react';
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
  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="testing-instructions">
          <p>Testing Instructions - Paste in any post to have it analysed for impact, current power words, and where they could improve</p>
        </div>
        <div className="power-words-intro">
          <h3>Power Words Analysis</h3>
          <p>Get contextual word suggestions to enhance your post's impact.</p>
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
            <h3>Power Words Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-item">
                <h4>Current Power Words:</h4>
                <p className="analysis-value">{powerResults.analysis}</p>
              </div>
            </div>
          </div>

          <div className="power-words-suggestions">
            {powerResults.suggestions?.map((category, index) => (
              <div key={index} className="power-category-card">
                <h4>{category.category}</h4>
                <div className="word-chips">
                  {category.words?.map((word, wordIndex) => (
                    <span 
                      key={wordIndex} 
                      className="word-chip"
                      onClick={() => navigator.clipboard.writeText(word)}
                      title="Click to copy"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <div className="example-usage">
                  <p><strong>Example:</strong> {category.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 