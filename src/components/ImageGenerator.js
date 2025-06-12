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
  const [generationType, setGenerationType] = useState('text-to-image');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImagePreview, setSourceImagePreview] = useState(null);

  const allModels = [
    { value: 'black-forest-labs/flux-schnell', label: 'Flux Schnell', description: 'Lightning‑fast text-to-image generation—ideal for quick prototyping' },
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra' },
    { value: 'google/imagen-4', label: 'Imagen 4' },
    { value: 'minimax/image-01', label: 'MiniMax 01' }
  ];

  const imageToImageModels = [
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra' },
    { value: 'minimax/image-01', label: 'MiniMax 01' },
    { value: 'flux-kontext-apps/portrait-series', label: 'Portrait Series (Flux Kontext)' }
  ];

  const portraitBackgroundColors = [
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
    { value: 'gray', label: 'Gray' },
    { value: 'green screen', label: 'Green Screen' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'original', label: 'Original' }
  ];

  const [portraitBackground, setPortraitBackground] = useState('white');

  const models = generationType === 'image-to-image' ? imageToImageModels : allModels;

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
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isGenerationTypeDropdownOpen, setIsGenerationTypeDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false);

  // Clear prompt and aspect ratio if Portrait Series model is selected
  useEffect(() => {
    if (generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') {
      setPrompt('');
      setSelectedAspectRatio('');
    }
  }, [generationType, selectedModel]);

  // Clear prompt if Portrait Series model is selected
  useEffect(() => {
    if (generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') {
      setPrompt('');
    }
  }, [generationType, selectedModel]);

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
    if (!prompt.trim() && !(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series')) {
      setError('Please enter a prompt first');
      return;
    }
    if (generationType === 'image-to-image' && !sourceImage) {
      setError('Please upload an image for Image to Image');
      return;
    }

    try {
      setIsGenerateLoading(true);
      setError('');
      let sourceImageBase64 = undefined;
      if (generationType === 'image-to-image' && sourceImage) {
        // Read file as base64
        sourceImageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            // Remove the data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(sourceImage);
        });
      }

      // Build request body
      let body = {
        prompt: prompt,
        model: selectedModel,
        aspectRatio: selectedAspectRatio,
        num_outputs: 2,
        ...(generationType === 'image-to-image' && sourceImageBase64 ? { sourceImageBase64 } : {})
      };
      // Portrait Series model specifics
      if (generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') {
        body = {
          model: selectedModel,
          aspectRatio: selectedAspectRatio,
          num_outputs: 3, // not used by backend, but for clarity
          sourceImageBase64,
          background: portraitBackground
        };
      }

      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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

  const handleGenerationTypeChange = (e) => {
    const newType = e.target.value;
    setGenerationType(newType);
    
    // If switching to image-to-image and current model isn't supported, switch to first supported model
    if (newType === 'image-to-image' && !imageToImageModels.some(model => model.value === selectedModel)) {
      setSelectedModel(imageToImageModels[0].value);
      setSelectedAspectRatio(aspectRatios[imageToImageModels[0].value][0].value);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (WebP, JPG, or PNG)');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSourceImage(file);
    setSourceImagePreview(previewUrl);
    setError('');
  };

  const handleRemoveImage = () => {
    if (sourceImagePreview) {
      URL.revokeObjectURL(sourceImagePreview);
    }
    setSourceImage(null);
    setSourceImagePreview(null);
  };

  return (
    <div className="optimizer-container image-generator-page">
      <div className="left-toolbar">
        <div className="toolbar-section">
          <h3>Generation Type</h3>
          <div className="model-select-container">
            <div
              className="model-select-header"
              onClick={() => setIsGenerationTypeDropdownOpen(!isGenerationTypeDropdownOpen)}
            >
              {generationType === 'text-to-image' ? 'Text to Image' : generationType === 'image-to-image' ? 'Image to Image' : generationType === 'text-to-video' ? 'Text to Video' : 'Image to Video'}
            </div>
            {isGenerationTypeDropdownOpen && (
              <div className="model-dropdown">
                <div className="model-option" onClick={() => { setGenerationType('text-to-image'); setIsGenerationTypeDropdownOpen(false); }}>Text to Image</div>
                <div className="model-option" onClick={() => { setGenerationType('image-to-image'); setIsGenerationTypeDropdownOpen(false); }}>Image to Image</div>
                <div className="model-option disabled">Text to Video (coming soon)</div>
                <div className="model-option disabled">Image to Video (coming soon)</div>
              </div>
            )}
          </div>
        </div>

        {generationType === 'image-to-image' && (
          <div className="toolbar-section">
            <h3>Source Image</h3>
            <div className="image-upload-container">
              {!sourceImagePreview ? (
                <div className="image-upload-box">
                  <input
                    type="file"
                    accept=".webp,.jpg,.jpeg,.png"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    <span>Click to upload image</span>
                    <span className="image-upload-hint">WebP, JPG, or PNG</span>
                  </label>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img 
                    src={sourceImagePreview} 
                    alt="Source" 
                    className="image-preview"
                  />
                  <button 
                    onClick={handleRemoveImage}
                    className="remove-image-button"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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
            disabled={generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series'}
            style={generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' ? { background: '#23242b', color: '#888' } : {}}
          />
        </div>

        <div className="toolbar-section">
          <h3>Model</h3>
          <div className="model-select-container">
            <div 
              className="model-select-header"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            >
              {models.find(m => m.value === selectedModel)?.label || 'Select Model'}
            </div>
            {isModelDropdownOpen && (
              <div className="model-dropdown">
                {models.map(model => (
                  <div
                    key={model.value}
                    className={`model-option ${model.value === selectedModel ? 'selected' : ''}`}
                    onMouseDown={e => {
                      e.preventDefault(); // Prevent focus loss
                      setSelectedModel(model.value);
                      setSelectedAspectRatio(aspectRatios[model.value][0].value);
                      setIsModelDropdownOpen(false);
                    }}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedModel(model.value);
                        setSelectedAspectRatio(aspectRatios[model.value][0].value);
                        setIsModelDropdownOpen(false);
                      }
                    }}
                    role="option"
                    aria-selected={model.value === selectedModel}
                  >
                    <div className="model-label">{model.label}</div>
                    {model.description && (
                      <div className="model-description">{model.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Portrait Series background color dropdown */}
        {generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' && (
          <div className="toolbar-section">
            <h3>Background Color</h3>
            <div className="model-select-container">
              <div
                className="model-select-header"
                onClick={() => setIsBackgroundDropdownOpen(!isBackgroundDropdownOpen)}
              >
                {portraitBackgroundColors.find(opt => opt.value === portraitBackground)?.label}
              </div>
              {isBackgroundDropdownOpen && (
                <div className="model-dropdown">
                  {portraitBackgroundColors.map(opt => (
                    <div
                      key={opt.value}
                      className={`model-option${portraitBackground === opt.value ? ' selected' : ''}`}
                      onClick={() => { setPortraitBackground(opt.value); setIsBackgroundDropdownOpen(false); }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="toolbar-section">
          <h3>Aspect Ratio</h3>
          <div className="model-select-container">
            <div
              className="model-select-header"
              onClick={() => {
                if (!(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series')) {
                  setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen);
                }
              }}
              style={generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' ? { background: '#23242b', color: '#888', cursor: 'not-allowed' } : {}}
            >
              {aspectRatios[selectedModel]?.find(r => r.value === selectedAspectRatio)?.label || 'Select Aspect Ratio'}
            </div>
            {isAspectRatioDropdownOpen && !(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') && (
              <div className="model-dropdown">
                {aspectRatios[selectedModel]?.map(ratio => (
                  <div
                    key={ratio.value}
                    className={`model-option${selectedAspectRatio === ratio.value ? ' selected' : ''}`}
                    onClick={() => { setSelectedAspectRatio(ratio.value); setIsAspectRatioDropdownOpen(false); }}
                  >
                    {ratio.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleGenerateWithFlux}
          disabled={
            isGenerateLoading ||
            (!prompt.trim() && !(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series')) ||
            (generationType === 'image-to-image' && !sourceImage)
          }
          className="generate-flux-button"
        >
          {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate'}
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