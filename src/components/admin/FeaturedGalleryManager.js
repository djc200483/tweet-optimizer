import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function FeaturedGalleryManager({ isOpen, onClose, onSave }) {
  const { token } = useAuth();
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImages, setCurrentImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentGallery();
      fetchAvailableImages();
    }
  }, [isOpen, token]);

  const fetchCurrentGallery = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/featured-gallery`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch current gallery');
      const data = await response.json();
      setCurrentImages(data);
      setSelectedImages(data.map(img => img.id));
    } catch (err) {
      setError('Failed to load current gallery');
    }
  };

  const fetchAvailableImages = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        search: search
      });
      
      const response = await fetch(`${API_URL}/admin/available-images?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch available images');
      const data = await response.json();
      
      if (page === 1) {
        setAvailableImages(data);
      } else {
        setAvailableImages(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 50);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load available images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageId) => {
    setSelectedImages(prev => {
      if (prev.includes(imageId)) {
        return prev.filter(id => id !== imageId);
      } else {
        if (prev.length >= 10) {
          setError('Maximum 10 images allowed');
          return prev;
        }
        return [...prev, imageId];
      }
    });
    setError('');
  };

  const handleSave = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }
    
    if (selectedImages.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/admin/featured-gallery`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds: selectedImages })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update gallery');
      }

      // Clear the featured gallery cache
      localStorage.removeItem('featured_gallery_cache');
      localStorage.removeItem('featured_gallery_cache_timestamp');

      setSuccess('Featured gallery updated successfully!');
      fetchCurrentGallery();
      if (onSave) onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAvailableImages(1, searchTerm);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchAvailableImages(currentPage + 1, searchTerm);
    }
  };

  const isImageSelected = (imageId) => selectedImages.includes(imageId);

  if (!isOpen) return null;

  return (
    <div className="featured-gallery-modal-overlay" onClick={onClose}>
      <div className="featured-gallery-modal" onClick={e => e.stopPropagation()}>
        <div className="featured-gallery-modal-header">
          <h2>Manage Featured Gallery</h2>
          <button className="featured-gallery-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="featured-gallery-modal-content">
          {error && <div className="admin-error">{error}</div>}
          {success && <div className="admin-success">{success}</div>}

          <div className="featured-gallery-current">
            <h3>Current Featured Images ({selectedImages.length}/10)</h3>
            <div className="featured-gallery-current-images">
              {currentImages.map(image => (
                <div 
                  key={image.id} 
                  className={`featured-gallery-current-item ${isImageSelected(image.id) ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <img 
                    src={image.s3_url || image.image_url} 
                    alt={image.prompt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="featured-gallery-current-overlay">
                    {isImageSelected(image.id) && <span className="selected-check">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="featured-gallery-available">
            <h3>Available Images (Last 20 Days)</h3>
            
            <form onSubmit={handleSearch} className="featured-gallery-search">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prompts..."
                className="featured-gallery-search-input"
              />
              <button type="submit" className="featured-gallery-search-button">
                Search
              </button>
            </form>

            <div className="featured-gallery-available-images">
              {availableImages.map(image => (
                <div 
                  key={image.id} 
                  className={`featured-gallery-available-item ${isImageSelected(image.id) ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  <img 
                    src={image.s3_url || image.image_url} 
                    alt={image.prompt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div className="featured-gallery-available-overlay">
                    {isImageSelected(image.id) && <span className="selected-check">✓</span>}
                  </div>
                  <div className="featured-gallery-available-prompt">
                    {image.prompt.substring(0, 50)}...
                  </div>
                </div>
              ))}
            </div>

            {loading && <LoadingSpinner />}
            
            {hasMore && !loading && (
              <button 
                onClick={loadMore} 
                className="featured-gallery-load-more"
              >
                Load More Images
              </button>
            )}
          </div>
        </div>

        <div className="featured-gallery-modal-actions">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="featured-gallery-save-button"
          >
            {saving ? 'Saving...' : 'Save Featured Gallery'}
          </button>
          <button 
            onClick={onClose} 
            className="featured-gallery-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 