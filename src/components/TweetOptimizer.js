import React from 'react';

export default function TweetOptimizer({ 
  tweet, 
  setTweet, 
  selectedTone, 
  setSelectedTone,
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
  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="testing-instructions">
          <p>Testing Instructions - Paste in any of your previous posts, change the tone and if you choose to, you can add a hook</p>
        </div>
        <div className="tone-selector">
          <h3>Select Tone:</h3>
          <div className="tone-options">
            {/* Professional & Business */}
            <div className="tone-category">
              <div className="tone-category-title">Professional & Business</div>
              <div className="tone-category-buttons">
                {tones.slice(0, 4).map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-button ${selectedTone === tone.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTone(tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Casual & Personal */}
            <div className="tone-category">
              <div className="tone-category-title">Casual & Personal</div>
              <div className="tone-category-buttons">
                {tones.slice(4, 8).map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-button ${selectedTone === tone.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTone(tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entertainment & Humor */}
            <div className="tone-category">
              <div className="tone-category-title">Entertainment & Humor</div>
              <div className="tone-category-buttons">
                {tones.slice(8, 12).map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-button ${selectedTone === tone.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTone(tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Educational & Informative */}
            <div className="tone-category">
              <div className="tone-category-title">Educational & Informative</div>
              <div className="tone-category-buttons">
                {tones.slice(12, 16).map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-button ${selectedTone === tone.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTone(tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspirational & Motivational */}
            <div className="tone-category">
              <div className="tone-category-title">Inspirational & Motivational</div>
              <div className="tone-category-buttons">
                {tones.slice(16, 20).map(tone => (
                  <button
                    key={tone.id}
                    className={`tone-button ${selectedTone === tone.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTone(tone.id)}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <textarea 
          placeholder="Enter your post here..."
          value={tweet}
          onChange={(e) => setTweet(e.target.value)}
          rows="4"
        />
        <div className="button-row">
          <select 
            className="hook-select"
            value={selectedHook}
            onChange={(e) => setSelectedHook(e.target.value)}
          >
            {hookOptions.map(hook => (
              <option key={hook.id} value={hook.id}>
                {hook.label}
              </option>
            ))}
          </select>
          <button 
            className="submit-button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Optimising...' : 'Optimise Post'}
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="loading-spinner">
          Generating optimised versions...
        </div>
      )}
      
      <div className="saved-tweets">
        <h2>Saved Posts and Optimisations</h2>
        {savedTweets.map((savedTweet, index) => (
          <div key={index} className="tweet-group">
            <div className="original-tweet-card">
              <div className="tweet-content">
                <div className="tweet-header">
                  <span className="original-label">Original Tweet</span>
                </div>
                {savedTweet.original}
              </div>
              <button 
                className="delete-button"
                onClick={() => handleDelete(index)}
              >
                Delete
              </button>
            </div>
            <div className="optimized-versions">
              {savedTweet.optimized.map((version, vIndex) => (
                <div key={vIndex} className="tweet-card">
                  <div className="tweet-content">
                    <div className="tweet-version">
                      <span>Version {vIndex + 1}</span>
                      <span 
                        className="tone-badge"
                        style={{ backgroundColor: toneColors[savedTweet.tone] }}
                      >
                        {tones.find(t => t.id === savedTweet.tone)?.label}
                      </span>
                    </div>
                    {version}
                  </div>
                  <button 
                    className="copy-button"
                    onClick={() => handleCopy(version)}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 