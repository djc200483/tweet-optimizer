import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from './auth/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageToPrompt() {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showImageGrid, setShowImageGrid] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are supported');
        return;
      }

      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:image/jpeg;base64, prefix
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const response = await fetch(`${API_URL}/analyze-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          imageBase64: base64Image
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
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateWithFlux = async () => {
    try {
      setIsGenerateLoading(true);
      setGeneratedImages([]); // Clear previous images
      setShowImageGrid(false);
      
      console.log('Sending prompt to generate images:', generatedPrompt);
      console.log('Using aspect ratio:', selectedAspectRatio);
      
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          prompt: generatedPrompt,
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
      setShowImageGrid(true);
    } catch (err) {
      console.error('Error generating images:', err);
      setError('Failed to generate images. Please try again.');
    } finally {
      setIsGenerateLoading(false);
    }
  };

  return (
    <div className="optimizer-container">
      <div className="feature-description">
        <p>Transform your images into detailed AI generation prompts. Our advanced analysis extracts key visual elements, style, and composition to create comprehensive prompts that capture your image's essence and help you recreate or enhance similar visuals.</p>
      </div>

      <div className="upload-section">
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          className="file-input"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="upload-button">
          Choose Image
        </label>
        
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
          style={{
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(255, 107, 107, 0.2)',
            minWidth: '160px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isLoading ? <LoadingSpinner size="inline" /> : 'Generate Prompt'}
        </button>
      </div>

      {generatedPrompt && (
        <div className="result-section">
          <div className="prompt-result">
            <div className="prompt-text">{generatedPrompt}</div>
            <button className="copy-button" onClick={handleCopy}>
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="aspect-ratio-section">
            <label htmlFor="aspect-ratio" style={{ marginRight: '12px' }}>Select Aspect Ratio:</label>
            <select
              id="aspect-ratio"
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value)}
              className="aspect-ratio-select"
              style={{ marginRight: '12px' }}
            >
              {aspectRatios.map(ratio => (
                <option key={ratio.value} value={ratio.value}>
                  {ratio.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleGenerateWithFlux}
              disabled={isGenerateLoading}
              className="generate-flux-button"
            >
              {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate with Flux'}
            </button>
          </div>

          {showImageGrid && generatedImages.length > 0 && (
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
        </div>
      )}
    </div>
  );
} 