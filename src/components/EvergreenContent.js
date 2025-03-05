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

        {/* Selection controls will go here */}
        
        {/* Generated content display will go here */}
      </div>
    </div>
  );
} 