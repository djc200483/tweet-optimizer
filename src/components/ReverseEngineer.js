import React, { useState } from 'react';

export default function ReverseEngineer({
  reverseText,
  setReverseText,
  handleReverseAnalysis,
  isLoading,
  analysisResults
}) {
  const [showAdaptation, setShowAdaptation] = useState(false);
  const [adaptedTweet, setAdaptedTweet] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);

  const handleAdaptation = async () => {
    try {
      setIsAdapting(true);
      const response = await fetch('http://localhost:3001/adapt-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tweet: reverseText,
          analysis: analysisResults
        }),
      });

      const data = await response.json();
      setAdaptedTweet(data.adaptedTweet);
      setShowAdaptation(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <textarea 
          placeholder="Paste a tweet you want to analyze..."
          value={reverseText}
          onChange={(e) => setReverseText(e.target.value)}
          rows="4"
        />
        <div className="button-row">
          <button 
            className="submit-button"
            onClick={handleReverseAnalysis}
            disabled={isLoading}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Tweet'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-spinner">
          Analyzing tweet structure...
        </div>
      )}

      {analysisResults && analysisResults.length > 0 && (
        <div className="analysis-container">
          <div className="analysis-card">
            <h3>Tweet Analysis</h3>
            <div className="analysis-content">
              {analysisResults.map((item, index) => (
                <div key={index} className="analysis-item">
                  <span className="analysis-label">{item.label}:</span>
                  <span className="analysis-value">{item.value}</span>
                </div>
              ))}
            </div>
            <button 
              className="adapt-button"
              onClick={handleAdaptation}
              disabled={isAdapting}
            >
              {isAdapting ? 'Generating...' : 'Generate Personalized Version'}
            </button>
          </div>

          {showAdaptation && adaptedTweet && (
            <div className="analysis-card adaptation-card">
              <h3>Personalized Adaptation</h3>
              <div className="adapted-tweet">
                {adaptedTweet}
              </div>
              <button 
                className="copy-button"
                onClick={() => navigator.clipboard.writeText(adaptedTweet)}
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 