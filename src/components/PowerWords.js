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
          <p>Get contextual word suggestions to enhance your tweet's impact.</p>
        </div>
        <textarea 
          placeholder="Paste text to analyze power words..."
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
            {isLoading ? 'Analyzing...' : 'Analyze Power Words'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          Analyzing power words...
        </div>
      )}

      {powerResults && powerResults.analysis && (
        <div className="analysis-container">
          <div className="analysis-card">
            <h3>Power Words Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-item">
                <span className="analysis-value">{powerResults.analysis}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 