import React, { useState, useEffect, useCallback } from 'react';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CACHE_KEY = 'featured_gallery_cache';
const CACHE_TIMESTAMP_KEY = 'featured_gallery_cache_timestamp';

// Helper function to check if cache is from same UTC day
const isSameUtcDay = (timestamp) => {
  if (!timestamp) return false;
  const cachedDate = new Date(timestamp);
  const now = new Date();
  return cachedDate.getUTCDate() === now.getUTCDate() &&
         cachedDate.getUTCMonth() === now.getUTCMonth() &&
         cachedDate.getUTCFullYear() === now.getUTCFullYear();
};

// Helper to get cached data with metadata
const getCachedData = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!isSameUtcDay(timestamp)) {
      return null;
    }
    const cachedData = localStorage.getItem(CACHE_KEY);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

// Helper to set cache with metadata
const setCacheData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Cache setting error:', error);
  }
};

export default function FeaturedGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const imagesPerPage = 5;
  const totalPages = Math.ceil(images.length / imagesPerPage);

  const fetchFeaturedImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check for cached data first
      const cachedData = getCachedData();
      if (cachedData) {
        setImages(cachedData);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/featured-gallery`);
      if (!response.ok) throw new Error('Failed to fetch featured images');
      const data = await response.json();
      const imagesData = data.images || [];
      setImages(imagesData);
      // Cache the new data
      setCacheData(imagesData);
    } catch (err) {
      setError('Failed to load featured images. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedImages();
  }, [fetchFeaturedImages]);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const getCurrentImages = () => {
    const startIndex = currentPage * imagesPerPage;
    return images.slice(startIndex, startIndex + imagesPerPage);
  };

  const renderImage = (image) => {
    return (
      <div 
        key={image.id} 
        className="featured-image-item"
        onClick={() => setSelectedImage(image)}
      >
        <div className="featured-image-placeholder">
          <img 
            src={image.s3_url || image.image_url}
            alt={image.prompt}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="featured-gallery">
        <div className="loading-container">Loading featured images...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="featured-gallery">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return null; // Don't render anything if no featured images
  }

  const currentImages = getCurrentImages();
  const showPrevArrow = currentPage > 0;
  const showNextArrow = currentPage < totalPages - 1;

  return (
    <div className="featured-gallery">
      <div className="featured-gallery-container">
        {showPrevArrow && (
          <button 
            className="featured-gallery-arrow featured-gallery-arrow-left"
            onClick={handlePrevious}
            aria-label="Previous images"
          >
            ‹
          </button>
        )}
        
        <div className="featured-gallery-images">
          {currentImages.map(renderImage)}
        </div>
        
        {showNextArrow && (
          <button 
            className="featured-gallery-arrow featured-gallery-arrow-right"
            onClick={handleNext}
            aria-label="Next images"
          >
            ›
          </button>
        )}
      </div>

      {/* Image Modal */}
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
                <div className="modal-title">Prompt</div>
                <div className="modal-header-actions">
                  <button 
                    className="close-modal" 
                    onClick={() => setSelectedImage(null)}
                  >×</button>
                </div>
              </div>
              <div className="modal-prompt-section">
                <div className="image-prompt">
                  {selectedImage.prompt}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 