import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Masonry from 'react-masonry-css';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGallery() {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('explore'); // Changed default to 'explore'
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const breakpointColumns = {
    default: 4,
    1200: 3,
    768: 2,
    480: 1
  };

  useEffect(() => {
    fetchImages(activeTab);
  }, [token, activeTab]);

  const fetchImages = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/images/${tab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${tab} images`);
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error(`Error fetching ${tab} images:`, err);
      setError(`Failed to load ${tab} images. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedImage(null);
  };

  const handleOpenInNewTab = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  const handleCopyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  if (loading) {
    return <div className="loading-container"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="image-gallery">
      <div className="gallery-tabs">
        <button 
          className={`choose-image-button ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => handleTabChange('explore')}
        >
          Explore
        </button>
        <button 
          className={`choose-image-button ${activeTab === 'my-images' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-images')}
        >
          My Images
        </button>
      </div>

      {images.length === 0 ? (
        <div className="no-images-message">
          {activeTab === 'my-images' 
            ? "You haven't generated any images yet. Try generating some images first!"
            : "No public images available yet. Be the first to share your creations!"}
        </div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
        >
          {images.map((image) => (
            <div 
              key={image.id} 
              className="image-item"
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.s3_url || image.image_url} alt={image.prompt} />
            </div>
          ))}
        </Masonry>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-image-container">
              <img 
                src={selectedImage.s3_url || selectedImage.image_url} 
                alt={selectedImage.prompt}
                loading="lazy"
              />
            </div>
            <div className="modal-info">
              <div className="modal-header">
                <div className="modal-title">Image Details</div>
                <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
              </div>
              
              <div className="modal-prompt-section">
                <div className="prompt-label">Prompt</div>
                <div className={`image-prompt ${isPromptCollapsed ? 'collapsed' : ''}`}>
                  {selectedImage.prompt}
                </div>
                {selectedImage.prompt.length > 200 && (
                  <button 
                    className="show-more-button"
                    onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
                  >
                    {isPromptCollapsed ? 'Show more' : 'Show less'}
                  </button>
                )}
              </div>

              <div className="modal-metadata">
                <div className="metadata-item">
                  <span className="metadata-label">Created</span>
                  <span className="metadata-value">{formatDate(selectedImage.created_at)}</span>
                </div>
                <div className="metadata-item">
                  <span className="metadata-label">Aspect Ratio</span>
                  <span className="metadata-value">{selectedImage.aspect_ratio}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="copy-button"
                  onClick={() => handleCopyPrompt(selectedImage.prompt)}
                  title={isCopied ? 'Copied!' : 'Copy Prompt'}
                >
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 