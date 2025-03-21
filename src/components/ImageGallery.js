import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Masonry from 'react-masonry-css';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGallery({ userId, onUsePrompt, refreshTrigger }) {
  const { token } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [isCopied, setIsCopied] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleImages, setVisibleImages] = useState(new Set());
  
  // Initialize state from localStorage if available
  const [exploreImages, setExploreImages] = useState(() => {
    const cached = localStorage.getItem('exploreImages');
    return cached ? JSON.parse(cached) : [];
  });
  const [lastExploreFetch, setLastExploreFetch] = useState(() => {
    return localStorage.getItem('lastExploreFetch') || null;
  });

  // Update localStorage when cache changes
  useEffect(() => {
    if (exploreImages.length > 0) {
      localStorage.setItem('exploreImages', JSON.stringify(exploreImages));
    }
  }, [exploreImages]);

  useEffect(() => {
    if (lastExploreFetch) {
      localStorage.setItem('lastExploreFetch', lastExploreFetch);
    }
  }, [lastExploreFetch]);

  const breakpointColumns = {
    default: 4,
    1200: 3,
    768: 2,
    500: 2
  };

  const shouldFetchExplore = useCallback(() => {
    if (!lastExploreFetch) return true;
    const now = new Date();
    const lastFetch = new Date(lastExploreFetch);
    // Only fetch if it's a new UTC day
    return now.getUTCDate() !== lastFetch.getUTCDate();
  }, [lastExploreFetch]);

  const fetchExploreImages = useCallback(async () => {
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
  }, [token]);

  const fetchMyImages = useCallback(async () => {
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
  }, [token]);

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
        // Always fetch fresh data when switching to My Images
        await fetchMyImages();
      }
    };

    fetchData();
  }, [token, activeTab, shouldFetchExplore, fetchExploreImages, fetchMyImages, exploreImages]);

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

  const handleUsePrompt = (e, prompt) => {
    e.stopPropagation(); // Prevent opening the modal
    onUsePrompt(prompt);
    // Scroll to the top where the textarea is
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Trigger the textarea resize
    setTimeout(() => {
      const textarea = document.querySelector('.prompt-textarea');
      if (textarea) {
        // Set height to auto first to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set the height to the scrollHeight
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, 0);
  };

  // Add effect to refresh My Images when new images are generated
  useEffect(() => {
    if (activeTab === 'my-images') {
      fetchMyImages();
    }
  }, [refreshTrigger, activeTab, fetchMyImages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisibleImages(prev => new Set([...prev, entry.target.dataset.imageId]));
          }
        });
      },
      { rootMargin: '100px' }
    );

    document.querySelectorAll('.image-placeholder').forEach(img => {
      observer.observe(img);
    });

    return () => observer.disconnect();
  }, [images]);

  const renderImage = (image) => {
    const isVisible = visibleImages.has(image.id.toString());
    
    return (
      <div 
        key={image.id} 
        className="image-item"
        onClick={() => handleOpenModal(image)}
      >
        <div 
          className="image-placeholder"
          data-image-id={image.id}
          style={{ 
            width: '100%',
            paddingBottom: '100%',
            background: '#1e2028',
            position: 'relative'
          }}
        >
          {isVisible && (
            <img 
              src={image.s3_url || image.image_url} 
              alt={image.prompt}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onLoad={(e) => {
                e.target.style.opacity = 1;
                console.log(`Image loaded: ${image.id}`);
              }}
            />
          )}
        </div>
        <div className="hover-overlay">
          <div className="creator-info">
            <span className="creator-handle">{image.creator_handle}</span>
            <div 
              className="use-prompt-icon"
              onClick={(e) => handleUsePrompt(e, image.prompt)}
              title="Use this prompt"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
              </svg>
              <span className="tooltip">Use Prompt</span>
            </div>
          </div>
        </div>
      </div>
    );
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
          {images.map(renderImage)}
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
                  <button className="close-modal" onClick={handleCloseModal}>├ù</button>
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
