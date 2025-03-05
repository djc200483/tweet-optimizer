import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function EvergreenContent() {
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedNiche || !selectedFormat || !selectedLength) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/generate-evergreen-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          niche: selectedNiche,
          format: selectedFormat,
          length: selectedLength
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="feature-description">
          <p>Generate engaging evergreen content tailored to your niche. Select your category, format type, and content length to create valuable posts that resonate with your audience.</p>
        </div>

        <div className="selection-controls">
          <div className="control-group">
            <label htmlFor="niche">Select Niche:</label>
            <select 
              id="niche" 
              value={selectedNiche} 
              onChange={(e) => setSelectedNiche(e.target.value)}
            >
              <option value="">Choose a niche...</option>
              <option value="Personal Development">Personal Development</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Business & Entrepreneurship">Business & Entrepreneurship</option>
              <option value="Technology & Innovation">Technology & Innovation</option>
              <option value="Education & Learning">Education & Learning</option>
              <option value="Finance & Money">Finance & Money</option>
              <option value="Creative Arts">Creative Arts</option>
              <option value="Lifestyle & Personal">Lifestyle & Personal</option>
              <option value="Science & Nature">Science & Nature</option>
              <option value="Food & Cooking">Food & Cooking</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="format">Select Format:</label>
            <select 
              id="format" 
              value={selectedFormat} 
              onChange={(e) => setSelectedFormat(e.target.value)}
            >
              <option value="">Choose a format...</option>
              <option value="A Question Post">Question Post</option>
              <option value="A Tip Post">Tip Post</option>
              <option value="A How-To Post">How-To Post</option>
              <option value="A List Post">List Post</option>
              <option value="A Story Post">Story Post</option>
              <option value="A Comparison Post">Comparison Post</option>
              <option value="A Problem-Solution Post">Problem-Solution Post</option>
              <option value="A Case Study Post">Case Study Post</option>
              <option value="A Definition Post">Definition Post</option>
              <option value="A Review Post">Review Post</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="length">Select Length:</label>
            <select 
              id="length" 
              value={selectedLength} 
              onChange={(e) => setSelectedLength(e.target.value)}
            >
              <option value="">Choose length...</option>
              <option value="short">Short (150 chars)</option>
              <option value="medium">Medium (400 chars)</option>
              <option value="long">Long (3000 chars)</option>
            </select>
          </div>

          <button 
            className="generate-button"
            onClick={handleGenerate}
            disabled={!selectedNiche || !selectedFormat || !selectedLength || isLoading}
          >
            {isLoading ? <LoadingSpinner /> : 'Generate Content'}
          </button>
        </div>

        {generatedContent && (
          <div className="generated-content">
            <div className="content-header">
              <h3>Generated Content</h3>
              <button className="copy-button" onClick={handleCopy}>
                Copy to Clipboard
              </button>
            </div>
            <div className="content-body">
              {generatedContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 