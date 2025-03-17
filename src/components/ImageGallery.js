import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGallery() {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('my-images'); // 'my-images' or 'explore'

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
    setSelectedImage(null); // Clear selected image when changing tabs
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
          className={`tab-button ${activeTab === 'my-images' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-images')}
        >
          My Images
        </button>
        <button 
          className={`tab-button ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => handleTabChange('explore')}
        >
          Explore
        </button>
      </div>

      {images.length === 0 ? (
        <div className="no-images-message">
          {activeTab === 'my-images' 
            ? "You haven't generated any images yet. Try generating some images first!"
            : "No public images available yet. Be the first to share your creations!"}
        </div>
      ) : (
        <div className="image-grid">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="image-item"
              onClick={() => setSelectedImage(image)}
            >
              <img src={image.s3_url || image.image_url} alt={image.prompt} />
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.s3_url || selectedImage.image_url} alt={selectedImage.prompt} />
            <div className="modal-info">
              <p className="image-prompt">{selectedImage.prompt}</p>
              <div className="image-metadata">
                <span className="date">
                  {formatDate(selectedImage.created_at)}
                </span>
                <span className="aspect-ratio">
                  {selectedImage.aspect_ratio}
                </span>
              </div>
            </div>
            <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
} 