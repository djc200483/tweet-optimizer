import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PromptAssistant() {
  const [selectedOptions, setSelectedOptions] = useState({
    subject: '',
    resolution: '',
    style: '',
    emotion: '',
    lighting: '',
    composition: '',
    timePeriod: '',
    extraDetails: ''
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [superchargedPrompt, setSuperchargedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSuperchargedCopied, setIsSuperchargedCopied] = useState(false);
  const [showImageFxTooltip, setShowImageFxTooltip] = useState(false);
  const [showFluxTooltip, setShowFluxTooltip] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showImageGrid, setShowImageGrid] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');

  const categories = {
    subject: {
      title: 'Subject Matter',
      options: ['Person/Character', 'Object', 'Scene', 'Landscape', 'Animal', 'Abstract Concept', 
                'Historical Event', 'Futuristic Theme', 'Sci-Fi Theme', 'Mythological Theme', 
                'Fantasy Theme', 'Pop Culture Inspired', 'Artistic Interpretation of a Phrase']
    },
    resolution: {
      title: 'Resolution',
      options: [
        'Low Resolution (480p)',
        'Standard HD (720p)',
        'Full HD (1080p)',
        '2K Resolution',
        '4K Ultra HD',
        '8K Ultra HD'
      ]
    },
    style: {
      title: 'Style & Medium',
      options: ['Photorealistic', 'Digital Painting', 'Sketch', 'Line Art', 'Watercolor', 
                'Oil Painting', '3D Rendered', 'Cyberpunk', 'Futuristic', 'Vintage', 'Retro', 
                'Surreal', 'Dreamlike', 'Noir', 'Dark Aesthetic', 'Pixel Art', '8-bit', 
                'Ukiyo-e', 'Traditional Asian Art', 'Impressionist', 'Classical Painting']
    },
    emotion: {
      title: 'Emotion & Mood',
      options: ['Happy', 'Joyful', 'Mysterious', 'Intriguing', 'Dark', 'Ominous', 'Epic', 
                'Grand', 'Melancholic', 'Sad', 'Inspirational', 'Uplifting', 'Peaceful', 
                'Serene', 'Eerie', 'Uncanny', 'Action-Packed', 'Intense']
    },
    lighting: {
      title: 'Lighting & Atmosphere',
      options: ['Warm Golden Hour', 'Cold Lighting', 'Moody Lighting', 'High Contrast', 
                'Dramatic Lighting', 'Soft Glow', 'Ethereal Glow', 'Foggy', 'Hazy', 
                'Cyberpunk Neon Glow', 'Vintage Film Grain', 'Harsh Shadows', 'Noir Style', 
                'Dreamlike Filters', 'Surreal Filters']
    },
    composition: {
      title: 'Composition & Perspective',
      options: ['Close-up', 'Macro Shot', 'Wide-angle View', 'Landscape View', 
                'First-person Perspective', 'Over-the-shoulder View', 'Dramatic Low Angle', 
                'Bird\'s-eye View', 'Symmetrical Composition', 'Chaotic Composition', 
                'Abstract Composition']
    },
    timePeriod: {
      title: 'Time Period & Setting',
      options: ['Ancient History', 'Roman Empire', 'Medieval', 'Renaissance', 'Futuristic', 
                'Sci-Fi', 'Modern-Day', 'Present', 'Alternative History', 'Steampunk 1800s', 
                'Fantasy World', 'Mythological Setting', 'Post-Apocalyptic', 'Ruined World']
    },
    extraDetails: {
      title: 'Extra Details & Enhancements',
      options: ['Hyper-detailed Textures', 'Ethereal Effects', 'Magical Effects', 
                'Realistic Weather Elements', 'Rain', 'Snow', 'Mist', 'Motion Blur', 
                'Action Streaks', 'Fire', 'Smoke', 'Explosions', 'Light Rays', 'God Rays']
    }
  };

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const handleOptionChange = (category, value) => {
    setSelectedOptions({
      ...selectedOptions,
      [category]: value
    });
  };

  const generatePrompt = () => {
    const parts = [];
    
    if (selectedOptions.subject) parts.push(selectedOptions.subject);
    if (selectedOptions.resolution) parts.push(`in ${selectedOptions.resolution}`);
    if (selectedOptions.style) parts.push(`in ${selectedOptions.style} style`);
    if (selectedOptions.emotion) parts.push(`with a ${selectedOptions.emotion.toLowerCase()} mood`);
    if (selectedOptions.lighting) parts.push(`featuring ${selectedOptions.lighting.toLowerCase()} lighting`);
    if (selectedOptions.composition) parts.push(`from a ${selectedOptions.composition.toLowerCase()} perspective`);
    if (selectedOptions.timePeriod) parts.push(`set in ${selectedOptions.timePeriod}`);
    if (selectedOptions.extraDetails) parts.push(`with ${selectedOptions.extraDetails.toLowerCase()} effects`);
    
    const prompt = parts.join(', ');
    setGeneratedPrompt(prompt);
    return prompt;
  };

  const handleSupercharge = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/rewrite-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tweet: generatedPrompt || generatePrompt(),
          tone: 'hyper-detailed',
          hook: 'descriptive',
          customInstructions: `Transform this image generation prompt into an extensively detailed masterpiece. 
            While preserving the core elements, significantly expand the description with:
            - Rich, intricate details about textures, materials, and surfaces (e.g., weathered metal, glossy reflections, rough stone)
            - Comprehensive lighting information (quality, direction, color, shadows, highlights)
            - Atmospheric and environmental details (particles, air quality, weather effects)
            - Specific color palettes and their interactions
            - Detailed spatial relationships and composition elements
            - Precise descriptions of any patterns, decorative elements, or unique features
            - Mood-enhancing environmental details (temperature, time of day, season)
            Feel free to be creative and expansive while maintaining the original intent and style.
            The goal is to create a prompt that would give an AI image generator enough detail to create a stunning, precise image.`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to supercharge prompt');
      }
      
      const data = await response.json();
      if (!data.rewrittenTweets || !data.rewrittenTweets.length) {
        throw new Error('Invalid response format');
      }
      
      setSuperchargedPrompt(data.rewrittenTweets[0]);
    } catch (error) {
      console.error('Error:', error);
      setSuperchargedPrompt(''); // Clear any previous result
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt || generatePrompt());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySupercharged = () => {
    navigator.clipboard.writeText(superchargedPrompt);
    setIsSuperchargedCopied(true);
    setTimeout(() => setIsSuperchargedCopied(false), 2000);
  };

  const handleGenerateWithImageFx = () => {
    // Copy the supercharged prompt to clipboard
    navigator.clipboard.writeText(superchargedPrompt);
    
    // Show the tooltip
    setShowImageFxTooltip(true);
    
    // Hide the tooltip after 3 seconds
    setTimeout(() => {
      setShowImageFxTooltip(false);
    }, 3000);
    
    // Open ImageFX in a new tab
    window.open('https://labs.google/fx/tools/image-fx', '_blank');
  };

  const handleGenerateWithFlux = async () => {
    try {
      setIsLoading(true);
      setGeneratedImages([]); // Clear previous images
      setShowImageGrid(false);
      
      // Get the appropriate prompt (either supercharged or regular)
      const promptToUse = superchargedPrompt || generatedPrompt || generatePrompt();
      
      // Call the backend endpoint
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: promptToUse,
          aspectRatio: selectedAspectRatio
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate image');
      }
      
      const data = await response.json();
      
      // Handle the array of image URLs
      if (Array.isArray(data.imageUrl)) {
        setGeneratedImages(data.imageUrl);
        setShowImageGrid(true);
      }

      // Show success tooltip
      setShowFluxTooltip(true);
      setTimeout(() => {
        setShowFluxTooltip(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="feature-description">
          <p>Create stunning AI image generation prompts with our intelligent assistant. Select from curated options across multiple categories to build detailed, professional-grade prompts that will help you achieve the exact visual results you're looking for.</p>
        </div>
        
        <div className="prompt-categories">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="category-section">
              <h3>{category.title}</h3>
              <select
                value={selectedOptions[key]}
                onChange={(e) => handleOptionChange(key, e.target.value)}
                disabled={isLoading}
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
            <h3>Generated Prompt:</h3>
            <div className="prompt-text">
              <textarea
                value={generatedPrompt || generatePrompt()}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                className="prompt-edit-textarea"
                rows={2}
              />
            </div>
            <div className="button-row">
              <button 
                className="copy-button"
                onClick={handleCopyPrompt}
                disabled={isLoading}
              >
                {isCopied ? 'Copied!' : 'Copy Prompt'}
              </button>
              <button 
                className="supercharge-button"
                onClick={handleSupercharge}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="inline" /> : 'Supercharge Prompt'}
              </button>
              <div className="generate-image-section">
                <div className="button-group">
                  <select
                    value={selectedAspectRatio}
                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    className="aspect-ratio-select"
                    disabled={isLoading}
                  >
                    {aspectRatios.map(ratio => (
                      <option key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="generate-image-button"
                    onClick={() => handleGenerateWithFlux()}
                    disabled={isLoading}
                  >
                    Generate with Flux
                  </button>
                  {showFluxTooltip && (
                    <div className="tooltip">
                      Prompt copied! Generating image with Flux...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {superchargedPrompt && (
              <div className="supercharged-result">
                <h3>Supercharged Prompt:</h3>
                <div className="prompt-text">
                  <textarea
                    value={superchargedPrompt}
                    onChange={(e) => setSuperchargedPrompt(e.target.value)}
                    className="prompt-edit-textarea"
                    rows={4}
                  />
                </div>
                <div className="button-row">
                  <div className="generate-image-section">
                    <div className="button-group">
                      <button 
                        className="copy-button"
                        onClick={handleCopySupercharged}
                        disabled={isLoading}
                      >
                        {isSuperchargedCopied ? 'Copied!' : 'Copy Supercharged Prompt'}
                      </button>
                      <select
                        value={selectedAspectRatio}
                        onChange={(e) => setSelectedAspectRatio(e.target.value)}
                        className="aspect-ratio-select"
                        disabled={isLoading}
                      >
                        {aspectRatios.map(ratio => (
                          <option key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="generate-image-button"
                        onClick={() => handleGenerateWithFlux()}
                        disabled={isLoading}
                      >
                        Generate with Flux
                      </button>
                      {showFluxTooltip && (
                        <div className="tooltip">
                          Prompt copied! Generating image with Flux...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showImageGrid && generatedImages.length > 0 && (
        <div className="generated-images-container">
          <h3>Generated Images:</h3>
          <div className="image-grid">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="image-item">
                <img 
                  src={imageUrl} 
                  alt={`Generated ${index + 1}`}
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this CSS at the end of your existing CSS file or in a new style tag
const styles = `
  .generated-images-container {
    margin-top: 20px;
    padding: 20px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 16px;
  }

  .image-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .image-item:hover {
    transform: scale(1.02);
  }

  .image-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .aspect-ratio-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 14px;
    margin-right: 8px;
    cursor: pointer;
  }

  .aspect-ratio-select:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

// Insert styles into document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet); 