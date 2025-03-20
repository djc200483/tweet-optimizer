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
  const [activeTab, setActiveTab] = useState('explore');
  const [isCopied, setIsCopied] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  // Add state for caching explore images and tracking last fetch time
  const [exploreImages, setExploreImages] = useState([]);
  const [lastExploreFetch, setLastExploreFetch] = useState(null);

  const breakpointColumns = {
    default: 4,
    1200: 3,
    768: 2,
    480: 1
  };

  // Check if we need to fetch new explore images
  const shouldFetchExplore = () => {
    if (!lastExploreFetch) return true;
    
    const now = new Date();
    const lastFetch = new Date(lastExploreFetch);
    
    // Fetch if:
    // 1. It's a new UTC day
    // 2. Or it's been more than an hour (to catch new images)
    return (
      now.getUTCDate() !== lastFetch.getUTCDate() ||
      now.getTime() - lastFetch.getTime() > 3600000 // 1 hour in milliseconds
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (activeTab === 'explore') {
        if (shouldFetchExplore()) {
          await fetchExploreImages();
        } else {
          setImages(exploreImages);
          setLoading(false);
        }
      } else {
        await fetchMyImages();
      }
    };

    fetchData();
  }, [token, activeTab]);

  const fetchExploreImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/images/explore`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch explore images');
      }

      const data = await response.json();
      setExploreImages(data);
      setImages(data);
      setLastExploreFetch(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching explore images:', err);
      setError('Failed to load explore images. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/images/my-images`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my images');
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error fetching my images:', err);
      setError('Failed to load your images. Please try again later.');
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

  const handleCopyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleOpenModal = (image) => {
    setScrollPosition(window.scrollY);
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
    setSelectedImage(null);
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
              onClick={() => handleOpenModal(image)}
            >
              <img src={image.s3_url || image.image_url} alt={image.prompt} />
            </div>
          ))}
        </Masonry>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
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
                <div className="modal-header-actions">
                  <button 
                    className={`copy-button ${isCopied ? 'copied' : ''}`}
                    onClick={() => handleCopyPrompt(selectedImage.prompt)}
                    aria-label={isCopied ? 'Copied!' : 'Copy Prompt'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                    >
                      <rect x="5.5" y="5.5" width="9" height="9" rx="1.5" strokeLinejoin="round"/>
                      <path d="M11 5.5V3.5C11 2.67157 10.3284 2 9.5 2H3.5C2.67157 2 2 2.67157 2 3.5V9.5C2 10.3284 2.67157 11 3.5 11H5.5" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="close-modal" onClick={handleCloseModal}>×</button>
                </div>
              </div>
              
              <div className="modal-prompt-section">
                <div className="prompt-label">Prompt</div>
                <div className="image-prompt">
                  {selectedImage.prompt}
                </div>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 