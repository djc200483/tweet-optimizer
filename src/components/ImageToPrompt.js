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
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
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
        >
          {isLoading ? <LoadingSpinner /> : 'Generate Prompt'}
        </button>
      </div>

      {generatedPrompt && (
        <div className="result-section">
          <div className="prompt-result">
            <div className="prompt-text">{generatedPrompt}</div>
            <button className="copy-button" onClick={handleCopy}>
              Copy Prompt
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 