import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from './auth/AuthContext';
import ImageGallery from './ImageGallery';
import './ImageGenerator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGenerator() {
  const { token, user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    adjustTextareaHeight();
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, []);

  const handleGenerateWithFlux = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    try {
      setIsGenerateLoading(true);
      setGeneratedImages([]);
      setError('');
      
      console.log('Sending prompt to generate images:', prompt);
      console.log('Using aspect ratio:', selectedAspectRatio);
      
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: prompt,
          aspectRatio: selectedAspectRatio,
          num_outputs: 2
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      console.log('Received image data:', data);
      
      if (!data.images || !Array.isArray(data.images)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Use the images directly from the server response
      setGeneratedImages(data.images);
    } catch (err) {
      console.error('Error generating images:', err);
      setError('Failed to generate images. Please try again.');
    } finally {
      setIsGenerateLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent page scroll when using arrow keys in textarea
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.stopPropagation();
    }
  };

  const handleWheel = (e) => {
    // If the textarea can scroll (content height > visible height)
    if (e.target.scrollHeight > e.target.clientHeight) {
      e.stopPropagation();
    }
  };

  return (
    <div className="optimizer-container">
      <div className="sticky-toolbar">
        <div className="toolbar-content">
          <div className="prompt-input-container">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              onWheel={handleWheel}
              placeholder="Enter your image prompt here..."
              className="prompt-textarea"
              rows={1}
            />
          </div>
          <div className="toolbar-controls">
            <select
              id="aspect-ratio"
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value)}
              className="aspect-ratio-select"
            >
              {aspectRatios.map(ratio => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateWithFlux}
              disabled={isGenerateLoading || !prompt.trim()}
              className="generate-flux-button"
            >
              {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate with Flux'}
            </button>
          </div>
        </div>
      </div>

      <div className="feature-description">
        <p>Create stunning AI-generated images from your text prompts. Simply enter your prompt, choose your preferred aspect ratio, and let our AI bring your vision to life.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {generatedImages.length > 0 && (
        <div className="generated-images-container">
          <h3>Generated Images</h3>
          <div className="image-grid">
            {generatedImages.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image.originalUrl} alt={`Generated ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <ImageGallery userId={user.id} onUsePrompt={setPrompt} />
      </div>
    </div>
  );
} 