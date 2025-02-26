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
    <div className="optimizer-container">
      <textarea
        className="optimizer-textarea"
        value={tweet}
        onChange={(e) => setTweet(e.target.value)}
        placeholder="Enter your post here..."
      />
      
      <div className="controls-container">
        <h3>Select Tone:</h3>
        <div className="tone-categories">
          {/* Professional & Business */}
          <div className="tone-group">
            <div className="tone-group-title">Professional & Business</div>
            <div className="tone-buttons">
              {tones.slice(0, 4).map(tone => (
                <button
                  key={tone.id}
                  className={`tone-select ${selectedTone === tone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                  style={{
                    background: selectedTone === tone.id ? 
                      `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                      '#23242b'
                  }}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Casual & Personal */}
          <div className="tone-group">
            <div className="tone-group-title">Casual & Personal</div>
            <div className="tone-buttons">
              {tones.slice(4, 8).map(tone => (
                <button
                  key={tone.id}
                  className={`tone-select ${selectedTone === tone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                  style={{
                    background: selectedTone === tone.id ? 
                      `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                      '#23242b'
                  }}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Entertainment & Humor */}
          <div className="tone-group">
            <div className="tone-group-title">Entertainment & Humor</div>
            <div className="tone-buttons">
              {tones.slice(8, 12).map(tone => (
                <button
                  key={tone.id}
                  className={`tone-select ${selectedTone === tone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                  style={{
                    background: selectedTone === tone.id ? 
                      `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                      '#23242b'
                  }}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Educational & Informative */}
          <div className="tone-group">
            <div className="tone-group-title">Educational & Informative</div>
            <div className="tone-buttons">
              {tones.slice(12, 16).map(tone => (
                <button
                  key={tone.id}
                  className={`tone-select ${selectedTone === tone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                  style={{
                    background: selectedTone === tone.id ? 
                      `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                      '#23242b'
                  }}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inspirational & Motivational */}
          <div className="tone-group">
            <div className="tone-group-title">Inspirational & Motivational</div>
            <div className="tone-buttons">
              {tones.slice(16, 20).map(tone => (
                <button
                  key={tone.id}
                  className={`tone-select ${selectedTone === tone.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                  style={{
                    background: selectedTone === tone.id ? 
                      `linear-gradient(135deg, ${toneColors[tone.id]}, #a855f7)` : 
                      '#23242b'
                  }}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
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
        disabled={!tweet.trim() || isLoading}
      >
        {isLoading ? 'Optimizing...' : 'Optimize Post'}
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
                      onClick={() => handleCopy(version)}
                    >
                      Copy
                    </button>
                    <button
                      className="action-button delete"
                      onClick={() => handleDelete(index, vIndex)}
                    >
                      Delete
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