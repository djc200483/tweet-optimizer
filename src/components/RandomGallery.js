// Trigger redeploy
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import Masonry from 'react-masonry-css';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const CACHE_KEY = 'random_gallery_cache';
const CACHE_TIMESTAMP_KEY = 'random_gallery_cache_timestamp';
const IMAGE_LIMIT = 80;

function getRandomSample(arr, n) {
  const result = [];
  const taken = new Set();
  while (result.length < n && result.length < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!taken.has(idx)) {
      result.push(arr[idx]);
      taken.add(idx);
    }
  }
  return result;
}

function isSameUtcDay(timestamp) {
  if (!timestamp) return false;
  const cachedDate = new Date(timestamp);
  const now = new Date();
  return cachedDate.getUTCDate() === now.getUTCDate() &&
    cachedDate.getUTCMonth() === now.getUTCMonth() &&
    cachedDate.getUTCFullYear() === now.getUTCFullYear();
}

export default function RandomGallery() {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [visibleImages, setVisibleImages] = useState(new Set());

  const breakpointColumns = {
    default: 5,
    1200: 4,
    768: 2,
    500: 2
  };

  const fetchAndCacheImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/images/liked-today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch images');
      const allImages = await response.json();
      setImages(allImages);
      localStorage.setItem(CACHE_KEY, JSON.stringify(allImages));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (err) {
      setError('Failed to load images. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached && isSameUtcDay(timestamp)) {
      setImages(JSON.parse(cached));
      setLoading(false);
    } else {
      fetchAndCacheImages();
    }
  }, [fetchAndCacheImages]);

  // Lazy loading logic (IntersectionObserver)
  useEffect(() => {
    setVisibleImages(new Set());
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        const imageId = entry.target.dataset.imageId;
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            setVisibleImages(prev => {
              const newSet = new Set(prev);
              newSet.add(imageId);
              return newSet;
            });
          });
        }
      });
    };
    const observer = new window.IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0.01
    });
    requestAnimationFrame(() => {
      const placeholders = document.querySelectorAll('.image-placeholder');
      placeholders.forEach(placeholder => {
        if (placeholder.dataset.imageId) {
          observer.observe(placeholder);
        }
      });
    });
    return () => observer.disconnect();
  }, [images]);

  const renderImage = (image) => {
    const isVisible = visibleImages.has(image.id.toString());
    return (
      <div 
        key={image.id} 
        className="image-item"
        onClick={() => setSelectedImage(image)}
      >
        <div 
          className="image-placeholder"
          data-image-id={image.id}
          style={{ 
            width: '100%',
            backgroundColor: '#1e2028',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          {isVisible ? (
            <img 
              src={image.s3_url || image.image_url}
              alt={image.prompt}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                opacity: 0,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onLoad={e => { e.target.style.opacity = 1; }}
            />
          ) : (
            <div 
              style={{ 
                width: '100%',
                paddingBottom: image.aspect_ratio === '1:1' ? '100%' : 
                              image.aspect_ratio === '4:3' ? '75%' : 
                              image.aspect_ratio === '3:4' ? '133.33%' :
                              image.aspect_ratio === '16:9' ? '56.25%' : '75%',
                backgroundColor: '#1e2028'
              }} 
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="image-gallery">
      {loading ? (
        <div className="loading-container">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid_column"
          style={{ gap: '2px' }}
        >
          {images.map(renderImage)}
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