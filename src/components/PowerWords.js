import React from 'react';

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
        <div className="power-words-intro">
          <h3>Power Words Analysis</h3>
          <p>Get contextual word suggestions to enhance your post's impact.</p>
        </div>
        <textarea 
          placeholder="Paste text to analyse power words..."
          value={powerText}
          onChange={(e) => setPowerText(e.target.value)}
          rows="4"
        />
        <div className="button-row">
          <button 
            className="submit-button"
            onClick={handlePowerAnalysis}
            disabled={isLoading}
          >
            {isLoading ? 'Analysing...' : 'Analyse Power Words'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          <div className="analysis-steps">
            <p>📝 Analyzing text structure...</p>
            <p>🔍 Identifying power words...</p>
            <p>✨ Generating suggestions...</p>
          </div>
        </div>
      )}

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