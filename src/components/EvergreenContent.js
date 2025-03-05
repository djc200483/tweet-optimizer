import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { nicheCategories, postFormats } from '../data/evergreen-data';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function EvergreenContent() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedSubcategory || !selectedFormat || !selectedLength) {
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
          niche: selectedSubcategory,
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
            <label htmlFor="category">Select Category:</label>
            <select 
              id="category" 
              value={selectedCategory} 
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('');
              }}
              className="form-select"
            >
              <option value="">Choose a category...</option>
              {Object.keys(nicheCategories).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {selectedCategory && (
            <div className="control-group">
              <label htmlFor="subcategory">Select Subcategory:</label>
              <select 
                id="subcategory" 
                value={selectedSubcategory} 
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a subcategory...</option>
                {nicheCategories[selectedCategory].map(subcategory => (
                  <option key={subcategory} value={subcategory}>{subcategory}</option>
                ))}
              </select>
            </div>
          )}

          <div className="control-group">
            <label htmlFor="format">Select Format:</label>
            <select 
              id="format" 
              value={selectedFormat} 
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="form-select"
            >
              <option value="">Choose a format...</option>
              {postFormats.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="length">Select Length:</label>
            <select 
              id="length" 
              value={selectedLength} 
              onChange={(e) => setSelectedLength(e.target.value)}
              className="form-select"
            >
              <option value="">Choose length...</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <button 
            className="generate-button"
            onClick={handleGenerate}
            disabled={!selectedSubcategory || !selectedFormat || !selectedLength || isLoading}
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