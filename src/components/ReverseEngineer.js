import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ReverseEngineer({
  reverseText,
  setReverseText,
  handleReverseAnalysis,
  isLoading,
  setIsLoading,
  analysisResults,
  setAnalysisResults
}) {
  const [showAdaptation, setShowAdaptation] = useState(false);
  const [adaptedTweet, setAdaptedTweet] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);

  const handleAdaptation = async () => {
    try {
      setIsAdapting(true);
      const response = await fetch(`${API_URL}/adapt-tweet`, {
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

  const handleAnalyze = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/analyze-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tweet: reverseText }),
      });

      const data = await response.json();
      
      // Convert the analysis string into the expected format
      const analysisArray = data.analysis ? [
        { label: 'Analysis', value: data.analysis }
      ] : [];

      setAnalysisResults(analysisArray);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="testing-instructions">
          <p>Testing Instructions - Paste in any post to have it analysed for the success criteria</p>
        </div>
        <textarea 
          placeholder="Paste a post you want to analyse..."
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
            {isLoading ? <LoadingSpinner size="inline" /> : 'Analyse Post'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-message">
          <LoadingSpinner size="large" />
          <p>Analyzing tweet structure...</p>
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
              {isAdapting ? <LoadingSpinner size="inline" /> : 'Generate Personalized Version'}
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