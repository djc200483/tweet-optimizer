import React from 'react';

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
          placeholder="Enter your tweet to get power word suggestions..."
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
            {isLoading ? 'Analyzing...' : 'Analyze & Suggest'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          <div className="analysis-steps">
            <p>📝 Analyzing tweet structure and tone...</p>
            <p>🔍 Identifying enhancement opportunities...</p>
            <p>✨ Generating power word suggestions...</p>
          </div>
        </div>
      )}

      {powerResults && (
        <div className="power-words-results">
          <div className="analysis-card">
            <h3>Tweet Analysis</h3>
            <div className="analysis-content">
              <div className="analysis-item">
                <span className="analysis-label">Current Tone:</span>
                <span className="analysis-value">{powerResults.tone}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Structure:</span>
                <span className="analysis-value">{powerResults.structure}</span>
              </div>
              <div className="analysis-item">
                <span className="analysis-label">Areas for Improvement:</span>
                <span className="analysis-value">{powerResults.improvements}</span>
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