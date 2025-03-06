import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function TweetOptimizer({ 
  tweet, 
  setTweet, 
  selectedTones, 
  setSelectedTones,
  selectedHook,
  setSelectedHook,
  handleSubmit,
  isLoading,
  savedTweets,
  handleDelete,
  handleCopy,
  tones,
  hookOptions,
  toneColors 
}) {
  const [copiedVersions, setCopiedVersions] = useState({});

  const handleToneSelect = (toneId) => {
    if (selectedTones.includes(toneId)) {
      // If tone is already selected, remove it
      setSelectedTones(selectedTones.filter(id => id !== toneId));
    } else if (selectedTones.length < 2) {
      // If less than 2 tones are selected, add the new tone
      setSelectedTones([...selectedTones, toneId]);
    }
    // If 2 tones are already selected, do nothing
  };

  const renderToneGroup = (startIdx, endIdx, title) => (
    <div className="tone-group">
      <div className="tone-group-title">{title}</div>
      <div className="tone-buttons">
        {tones.slice(startIdx, endIdx).map(tone => (
          <button
            key={tone.id}
            className={`tone-select ${selectedTones.includes(tone.id) ? 'selected' : ''}`}
            onClick={() => handleToneSelect(tone.id)}
            style={{
              background: selectedTones.includes(tone.id) ? 
                `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                '#23242b'
            }}
          >
            {tone.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="optimizer-container">
      <div className="feature-description">
        <p>Transform your social media posts with AI-powered optimisation. Select your desired tone and hook type, and we'll help you craft engaging content that resonates with your audience.</p>
      </div>
      <textarea
        className="optimizer-textarea"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
        placeholder="Enter your post here..."
      />
      
      <div className="controls-container">
        <h3>Select Tone (Max 2):</h3>
        <div className="tone-categories">
          {renderToneGroup(0, 4, "Professional & Business")}
          {renderToneGroup(4, 8, "Casual & Personal")}
          {renderToneGroup(8, 12, "Entertainment & Humor")}
          {renderToneGroup(12, 16, "Educational & Informative")}
          {renderToneGroup(16, 20, "Inspirational & Motivational")}
        </div>
        
        <div className="hook-container">
          <span className="hook-label">Select Hook:</span>
          <select
            className="hook-select custom-select"
            value={selectedHook}
            onChange={(e) => setSelectedHook(e.target.value)}
          >
            {hookOptions.map(hook => (
              <option key={hook.id} value={hook.id}>
                {hook.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        className="optimize-button"
        onClick={handleSubmit}
        disabled={!tweet.trim() || isLoading || selectedTones.length === 0}
      >
        {isLoading ? <LoadingSpinner size="inline" /> : 'Optimise Post'}
      </button>

      <div className="results-container">
        {savedTweets.map((tweetGroup, index) => (
          <div key={index} className="result-card">
            <div className="original-tweet-card">
              <div className="tweet-header">
                <span className="tone-label">Original:</span>
              </div>
              <div className="tweet-content">{tweetGroup.original}</div>
            </div>
            
            <div className="result-versions">
              {tweetGroup.optimized.map((version, vIndex) => (
                <div key={vIndex} className="result-version">
                  <div className="tweet-content">{version}</div>
                  <div className="result-actions">
                    <button
                      className="action-button"
                      onClick={() => handleCopy(version, vIndex)}
                    >
                      {copiedVersions[vIndex] ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 