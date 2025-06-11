import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from './auth/AuthContext';
import ImageGallery from './ImageGallery';
import './ImageGenerator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGenerator() {
  const { token, user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const models = [
    { value: 'black-forest-labs/flux-schnell', label: 'Flux Schnell' },
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra' },
    { value: 'google/imagen-4', label: 'Imagen 4' },
    { value: 'minimax/image-01', label: 'MiniMax 01' }
  ];

  const naturalAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '21:9', label: 'Ultrawide (21:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '9:21', label: 'Tall Vertical (9:21)' }
  ];

  const flux11ProAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Standard (4:3)' }
  ];

  const imagen4AspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Vertical (9:16)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Standard (4:3)' }
  ];

  const minimaxAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '21:9', label: 'Ultrawide (21:9)' }
  ];

  const aspectRatios = {
    'black-forest-labs/flux-schnell': naturalAspectRatios,
    'black-forest-labs/flux-1.1-pro': flux11ProAspectRatios,
    'black-forest-labs/flux-1.1-pro-ultra': naturalAspectRatios,
    'google/imagen-4': imagen4AspectRatios,
    'minimax/image-01': minimaxAspectRatios
  };

  const defaultModel = 'black-forest-labs/flux-schnell';
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[defaultModel][0].value);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      setError('');
      
      console.log('Sending prompt to generate images:', prompt);
      console.log('Using model:', selectedModel);
      console.log('Using aspect ratio:', selectedAspectRatio);
      
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: prompt,
          model: selectedModel,
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

      // Trigger a refresh of the gallery
      setRefreshTrigger(prev => prev + 1);
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

  const handleTouchStart = (e) => {
    // Store the initial touch position and scroll position
    e.target.dataset.touchStartY = e.touches[0].clientY;
    e.target.dataset.scrollTop = e.target.scrollTop;
  };

  const handleTouchMove = (e) => {
    const textarea = e.target;
    const touchStartY = parseFloat(textarea.dataset.touchStartY);
    const touchEndY = e.touches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    const scrollTop = parseFloat(textarea.dataset.scrollTop);

    // If the textarea has scrollable content
    if (textarea.scrollHeight > textarea.clientHeight) {
      // If we're at the top and trying to scroll up, or at the bottom and trying to scroll down
      if ((textarea.scrollTop <= 0 && deltaY < 0) || 
          (textarea.scrollTop >= textarea.scrollHeight - textarea.clientHeight && deltaY > 0)) {
        // Let the page scroll
        return;
      }
      // Otherwise, prevent page scroll and let the textarea scroll
      e.stopPropagation();
    }
  };

  return (
    <div className="optimizer-container image-generator-page">
      <div className="left-toolbar">
        <div className="toolbar-section">
          <h3>Prompt</h3>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            placeholder="Enter your image prompt here..."
            className="prompt-textarea"
            rows={4}
          />
        </div>

        <div className="toolbar-section">
          <h3>Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => {
              const newModel = e.target.value;
              setSelectedModel(newModel);
              setSelectedAspectRatio(aspectRatios[newModel][0].value);
            }}
            className="model-select"
          >
            {models.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-section">
          <h3>Aspect Ratio</h3>
          <select
            value={selectedAspectRatio}
            onChange={(e) => setSelectedAspectRatio(e.target.value)}
            className="aspect-ratio-select"
          >
            {aspectRatios[selectedModel]?.map(ratio => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerateWithFlux}
          disabled={isGenerateLoading || !prompt.trim()}
          className="generate-flux-button"
        >
          {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate with Flux'}
        </button>
      </div>

      <div className="main-content">
        <div className="feature-description">
          <p>Create stunning AI-generated images from your text prompts. Simply enter your prompt, choose your preferred model and aspect ratio, and let our AI bring your vision to life.</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="gallery-wrapper">
          <ImageGallery 
            userId={user.id} 
            onUsePrompt={setPrompt} 
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
} 