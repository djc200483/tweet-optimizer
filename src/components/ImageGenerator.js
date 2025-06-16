import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from './auth/AuthContext';
import ImageGallery from './ImageGallery';
import './ImageGenerator.css';
import ReactDOM from 'react-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGenerator() {
  const { token, user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generationType, setGenerationType] = useState('text-to-image');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImagePreview, setSourceImagePreview] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const allModels = [
    { value: 'black-forest-labs/flux-schnell', label: 'Flux Schnell', description: 'Lightning‑fast text-to-image generation—ideal for quick prototyping' },
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro', description: 'High-quality, fast text-to-image model balancing image fidelity with prompt accuracy.' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra', description: 'Ultra‑high resolution images quickly, with photoreal realism.' },
    { value: 'google/imagen-4', label: 'Imagen 4', description: 'Top-tier photorealism, sharp detail and typography.' },
    { value: 'minimax/image-01', label: 'MiniMax 01', description: 'High Quality Text-to-image model' },
    { value: 'recraft-ai/recraft-v3', label: 'Recraft V3', description: 'High-quality image generation with style control.' }
  ];

  const imageToImageModels = [
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro', description: 'High-quality, fast text-to-image model balancing image fidelity with prompt accuracy.' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra', description: 'Ultra‑high resolution images quickly, with photoreal realism.' },
    { value: 'minimax/image-01', label: 'MiniMax 01', description: 'High Quality Text-to-image model' },
    { value: 'flux-kontext-apps/portrait-series', label: 'Portrait Series (Flux Kontext)', description: 'Generates diverse portrait variations from one photo.' }
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

  const recraftAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '1:2', label: 'Tall (1:2)' },
    { value: '2:1', label: 'Wide (2:1)' },
    { value: '7:5', label: '7:5' },
    { value: '5:7', label: '5:7' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '3:5', label: '3:5' },
    { value: '5:3', label: '5:3' }
  ];

  const aspectRatios = {
    'black-forest-labs/flux-schnell': naturalAspectRatios,
    'black-forest-labs/flux-1.1-pro': flux11ProAspectRatios,
    'black-forest-labs/flux-1.1-pro-ultra': naturalAspectRatios,
    'google/imagen-4': imagen4AspectRatios,
    'minimax/image-01': minimaxAspectRatios,
    'recraft-ai/recraft-v3': recraftAspectRatios
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
  const backgroundHeaderRef = useRef(null);
  const [backgroundDropdownPos, setBackgroundDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [selectedStyle, setSelectedStyle] = useState('realistic_image');
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isSourceImageDropdownOpen, setIsSourceImageDropdownOpen] = useState(false);

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
    if (generationType === 'image-to-prompt' && !sourceImage) {
      setError('Please upload an image first');
      return;
    }

    try {
      setIsGenerateLoading(true);
      setError('');
      let sourceImageBase64 = undefined;
      if (generationType === 'image-to-prompt' && sourceImage) {
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

      // Call the analyze-image endpoint to get the prompt
      const response = await fetch(`${API_URL}/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          imageBase64: sourceImageBase64
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
      setShowImageGrid(false); // Reset image grid when new prompt is generated
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to analyze image. Please try again.');
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

  // When opening the background dropdown, calculate its position
  const openBackgroundDropdown = () => {
    if (backgroundHeaderRef.current) {
      const rect = backgroundHeaderRef.current.getBoundingClientRect();
      setBackgroundDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsBackgroundDropdownOpen(true);
  };

  // User-friendly style labels for recraft
  const recraftStyles = [
    { value: 'realistic_image', label: 'Realistic Image' },
    { value: 'digital_illustration', label: 'Digital Illustration' },
    { value: 'digital_illustration/pixel_art', label: 'Pixel Art' },
    { value: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
    { value: 'digital_illustration/grain', label: 'Grain Illustration' },
    { value: 'digital_illustration/infantile_sketch', label: 'Infantile Sketch' },
    { value: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
    { value: 'digital_illustration/handmade_3d', label: 'Handmade 3D' },
    { value: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
    { value: 'digital_illustration/engraving_color', label: 'Engraving Color' },
    { value: 'digital_illustration/2d_art_poster_2', label: '2D Art Poster 2' },
    { value: 'realistic_image/b_and_w', label: 'Black & White' },
    { value: 'realistic_image/hard_flash', label: 'Hard Flash' },
    { value: 'realistic_image/hdr', label: 'HDR' },
    { value: 'realistic_image/natural_light', label: 'Natural Light' },
    { value: 'realistic_image/studio_portrait', label: 'Studio Portrait' },
    { value: 'realistic_image/enterprise', label: 'Enterprise' },
    { value: 'realistic_image/motion_blur', label: 'Motion Blur' }
  ];

  const handleSourceImageChange = (e) => {
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

  return (
    <div className="optimizer-container image-generator-page">
      <button 
        className="back-home-button"
        onClick={() => window.location.href = '/'}
        style={{ position: 'absolute', top: '10px', left: '20px' }}
      >
        Home
      </button>
      <div className="left-toolbar">
        <div className="toolbar-section">
          <h3>Generation Type</h3>
          <div className="model-select-container">
            <div
              className="model-select-header"
              onClick={() => setIsGenerationTypeDropdownOpen(!isGenerationTypeDropdownOpen)}
            >
              {generationType === 'text-to-image' ? 'Text to Image' : generationType === 'image-to-image' ? 'Image to Image' : generationType === 'image-to-prompt' ? 'Image to Prompt' : 'Image to Video'}
            </div>
            {isGenerationTypeDropdownOpen && (
              <div className="model-dropdown">
                <div className="model-option" onClick={() => { setGenerationType('text-to-image'); setIsGenerationTypeDropdownOpen(false); }}>Text to Image</div>
                <div className="model-option" onClick={() => { setGenerationType('image-to-image'); setIsGenerationTypeDropdownOpen(false); }}>Image to Image</div>
                <div className="model-option" onClick={() => { setGenerationType('image-to-prompt'); setIsGenerationTypeDropdownOpen(false); }}>Image to Prompt</div>
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

        {generationType !== 'image-to-prompt' && (
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
        )}

        {generationType === 'image-to-prompt' && (
          <div className="toolbar-section">
            <h3>Source Image</h3>
            <div className="image-upload-container">
              {!sourceImagePreview ? (
                <div className="image-upload-box">
                  <input
                    type="file"
                    accept=".webp,.jpg,.jpeg,.png"
                    onChange={handleSourceImageChange}
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

        {generationType === 'image-to-prompt' && (
          <div className="toolbar-section">
            <h3>Prompt Output</h3>
            <div className="prompt-output">
              {generatedPrompt ? (
                <div className="prompt-text">{generatedPrompt}</div>
              ) : (
                <div className="prompt-placeholder">Generated prompt will appear here</div>
              )}
            </div>
          </div>
        )}

        {generationType !== 'image-to-prompt' && (
          <div className="toolbar-section">
            <label className="toolbar-label">Model</label>
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
                        e.preventDefault();
                        setSelectedModel(model.value);
                        if (model.value === 'flux-kontext-apps/portrait-series') {
                          setSelectedAspectRatio('');
                        } else {
                          setSelectedAspectRatio(aspectRatios[model.value][0].value);
                        }
                        setIsModelDropdownOpen(false);
                      }}
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setSelectedModel(model.value);
                          if (model.value === 'flux-kontext-apps/portrait-series') {
                            setSelectedAspectRatio('');
                          } else {
                            setSelectedAspectRatio(aspectRatios[model.value][0].value);
                          }
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
        )}

        {/* Portrait Series background color dropdown */}
        {generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' && (
          <div className="toolbar-section">
            <h3>Background Color</h3>
            <div className="model-select-container">
              <div
                className="model-select-header"
                ref={backgroundHeaderRef}
                onClick={openBackgroundDropdown}
              >
                {portraitBackgroundColors.find(opt => opt.value === portraitBackground)?.label}
              </div>
              {isBackgroundDropdownOpen && ReactDOM.createPortal(
                <div
                  className="model-dropdown"
                  style={{
                    position: 'absolute',
                    top: backgroundDropdownPos.top,
                    left: backgroundDropdownPos.left,
                    width: backgroundDropdownPos.width,
                    zIndex: 3000
                  }}
                >
                  {portraitBackgroundColors.map(opt => (
                    <div
                      key={opt.value}
                      className={`model-option${portraitBackground === opt.value ? ' selected' : ''}`}
                      onMouseDown={() => { setPortraitBackground(opt.value); setIsBackgroundDropdownOpen(false); }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>
        )}

        {generationType !== 'image-to-prompt' && (
          <div className="toolbar-section">
            <label className="toolbar-label">Aspect Ratio</label>
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
        )}

        {/* Show style dropdown only for recraft-ai/recraft-v3 in text-to-image */}
        {generationType === 'text-to-image' && selectedModel === 'recraft-ai/recraft-v3' && (
          <div className="toolbar-section">
            <h3>Style</h3>
            <div className="model-select-container">
              <div
                className="model-select-header"
                onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
              >
                {recraftStyles.find(opt => opt.value === selectedStyle)?.label || 'Select Style'}
              </div>
              {isStyleDropdownOpen && (
                <div className="model-dropdown">
                  {recraftStyles.map(opt => (
                    <div
                      key={opt.value}
                      className={`model-option${selectedStyle === opt.value ? ' selected' : ''}`}
                      onMouseDown={() => { setSelectedStyle(opt.value); setIsStyleDropdownOpen(false); }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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