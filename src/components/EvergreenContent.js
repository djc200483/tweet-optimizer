import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { nicheCategories, postFormats } from '../data/evergreen-data';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function EvergreenContent() {
  const [selectedOptions, setSelectedOptions] = useState({
    category: '',
    subcategory: '',
    format: '',
    length: ''
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const categories = {
    category: {
      title: 'Main Category',
      options: Object.keys(nicheCategories)
    },
    subcategory: {
      title: 'Subcategory',
      options: selectedOptions.category ? nicheCategories[selectedOptions.category] : []
    },
    format: {
      title: 'Post Format',
      options: postFormats
    },
    length: {
      title: 'Content Length',
      options: ['Short', 'Medium', 'Long']
    }
  };

  const handleOptionChange = (category, value) => {
    setSelectedOptions(prev => {
      const newOptions = {
        ...prev,
        [category]: value
      };
      // Reset subcategory when category changes
      if (category === 'category') {
        newOptions.subcategory = '';
      }
      return newOptions;
    });
  };

  const handleGenerate = async () => {
    if (!selectedOptions.subcategory || !selectedOptions.format || !selectedOptions.length) {
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
          niche: selectedOptions.subcategory,
          format: selectedOptions.format,
          length: selectedOptions.length.toLowerCase()
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
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="feature-description">
          <p>Generate engaging evergreen content tailored to your niche. Select your category, format type, and content length to create valuable posts that resonate with your audience.</p>
        </div>
        
        <div className="prompt-categories">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="category-section">
              <h3>{category.title}</h3>
              <select
                value={selectedOptions[key]}
                onChange={(e) => handleOptionChange(key, e.target.value)}
                disabled={isLoading || (key === 'subcategory' && !selectedOptions.category)}
              >
                <option value="">Select {category.title}</option>
                {category.options.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {Object.values(selectedOptions).some(value => value) && (
          <div className="prompt-result">
            <div className="button-row">
              <button 
                className="submit-button"
                onClick={handleGenerate}
                disabled={!selectedOptions.subcategory || !selectedOptions.format || !selectedOptions.length || isLoading}
              >
                {isLoading ? <LoadingSpinner size="inline" /> : 'Generate Content'}
              </button>
            </div>

            {generatedContent && (
              <div className="generated-content">
                <h3>Generated Content:</h3>
                <div className="content-body">
                  {generatedContent}
                </div>
                <div className="button-row">
                  <button 
                    className="copy-button"
                    onClick={handleCopy}
                    disabled={isLoading}
                  >
                    {isCopied ? 'Copied!' : 'Copy Content'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}