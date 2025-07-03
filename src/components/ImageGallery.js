import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Masonry from 'react-masonry-css';
import './ImageGallery.css';
import { ReactComponent as HeartIcon } from '../assets/heart.svg';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CACHE_KEY = 'explore_images_cache';
const CACHE_TIMESTAMP_KEY = 'explore_images_cache_timestamp';

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

// Utility function to detect mobile devices
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function ImageGallery({ userId, onUsePrompt, refreshTrigger }) {
  const { token, user } = useAuth();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [isCopied, setIsCopied] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleImages, setVisibleImages] = useState(new Set());
  const [newImagesCount, setNewImagesCount] = useState(0);
  
  // Initialize state from localStorage if available
  const [exploreImages, setExploreImages] = useState(() => {
    const cached = localStorage.getItem('exploreImages');
    return cached ? JSON.parse(cached) : [];
  });
  const [lastExploreFetch, setLastExploreFetch] = useState(() => {
    return localStorage.getItem('lastExploreFetch') || null;
  });
  const [likeStatus, setLikeStatus] = useState({});

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
    default: 5,
    1200: 4,
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

      // Check for cached data first
      const cachedData = getCachedData();
      if (cachedData) {
        setExploreImages(cachedData);
        setImages(cachedData);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/images/explore`);

      if (!response.ok) {
        throw new Error('Failed to fetch explore images');
      }

      const data = await response.json();
      setExploreImages(data);
      setImages(data);
      // Cache the new data
      setCacheData(data);
      setLastExploreFetch(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching explore images:', err);
      setError('Failed to load explore images. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          setVisibleImages(new Set()); // Reset visible images when loading cached images
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
    if (tab === activeTab) return; // Don't do anything if clicking the same tab
    setActiveTab(tab);
    setNewImagesCount(0); // Reset counter when switching to any tab
    setSelectedImage(null);
    setVisibleImages(new Set());
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

  // Effect to handle new images counter
  useEffect(() => {
    if (activeTab === 'explore' && refreshTrigger) {
      const lastRefreshTrigger = localStorage.getItem('lastRefreshTrigger');
      if (lastRefreshTrigger !== refreshTrigger.toString()) {
        setNewImagesCount(prev => prev + 2);
        localStorage.setItem('lastRefreshTrigger', refreshTrigger.toString());
      }
    }
  }, [refreshTrigger, activeTab]);

  useEffect(() => {
    // Reset visible images when images array changes
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

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '200px 0px',
      threshold: 0.01
    });

    // Wait for next frame to ensure DOM is ready
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

  // Update likeStatus when images change (Explore tab only)
  useEffect(() => {
    if (activeTab === 'explore' && images.length > 0) {
      // Load saved like status first
      const savedLikeStatus = localStorage.getItem('exploreLikeStatus');
      const savedStatus = savedLikeStatus ? JSON.parse(savedLikeStatus) : {};
      
      // Merge API data with saved like status
      const status = {};
      images.forEach(img => {
        const savedLike = savedStatus[img.id];
        status[img.id] = {
          liked: savedLike ? savedLike.liked : !!img.liked_by_user,
          count: savedLike ? savedLike.count : (typeof img.like_count === 'number' ? img.like_count : 0)
        };
      });
      setLikeStatus(status);
    }
  }, [images, activeTab]);

  // Persist likeStatus to localStorage
  useEffect(() => {
    if (activeTab === 'explore' && Object.keys(likeStatus).length > 0) {
      localStorage.setItem('exploreLikeStatus', JSON.stringify(likeStatus));
    }
  }, [likeStatus, activeTab]);

  // Load likeStatus from localStorage on mount
  useEffect(() => {
    if (activeTab === 'explore') {
      const savedLikeStatus = localStorage.getItem('exploreLikeStatus');
      if (savedLikeStatus) {
        try {
          setLikeStatus(JSON.parse(savedLikeStatus));
        } catch (error) {
          console.error('Error loading like status:', error);
        }
      }
    }
  }, [activeTab]);

  // Like/unlike handler
  const handleToggleLike = async (e, imageId) => {
    e.stopPropagation();
    if (!token) return;
    
    // Optimistic update
    setLikeStatus(prev => ({
      ...prev,
      [imageId]: {
        ...prev[imageId],
        liked: !prev[imageId]?.liked,
        count: prev[imageId]?.liked ? prev[imageId].count - 1 : prev[imageId].count + 1
      }
    }));
    
    try {
      const res = await fetch(`${API_URL}/api/images/${imageId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLikeStatus(prev => ({
          ...prev,
          [imageId]: {
            liked: data.liked_by_user,
            count: data.like_count
          }
        }));
      }
    } catch (err) {
      // Revert optimistic update on error
      setLikeStatus(prev => ({
        ...prev,
        [imageId]: {
          ...prev[imageId],
          liked: !prev[imageId]?.liked,
          count: prev[imageId]?.liked ? prev[imageId].count + 1 : prev[imageId].count - 1
        }
      }));
    }
  };

  const renderImage = (image) => {
    const isVisible = visibleImages.has(image.id.toString());
    const like = likeStatus[image.id] || { liked: false, count: 0 };
    const hasVideo = image.video_url;
    
    return (
      <div 
        key={image.id} 
        className="image-item"
        onClick={() => handleOpenModal(image)}
        onMouseEnter={(e) => {
          if (hasVideo) {
            const videoElement = e.currentTarget.querySelector('video');
            if (videoElement) {
              videoElement.play().catch(err => console.log('Video play failed:', err));
            }
          }
        }}
        onMouseLeave={(e) => {
          if (hasVideo) {
            const videoElement = e.currentTarget.querySelector('video');
            if (videoElement) {
              videoElement.pause();
              videoElement.currentTime = 0;
            }
          }
        }}
      >
        <div 
          className="image-placeholder"
          data-image-id={image.id}
          style={{ 
            width: '100%',
            backgroundColor: '#1e2028',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {isVisible ? (
            <>
              <img 
                src={image.s3_url || image.image_url}
                alt={image.prompt}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: hasVideo ? 'none' : 'block',
                  opacity: 0,
                  transition: 'opacity 0.3s ease-in-out'
                }}
                onLoad={(e) => {
                  e.target.style.opacity = 1;
                  console.log(`Image loaded: ${image.id}`);
                }}
              />
              {hasVideo && (
                <video
                  src={image.video_url}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    opacity: 1,
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                  muted
                  loop
                  playsInline
                />
              )}
              {/* Play button overlay for videos in My Images gallery */}
              {hasVideo && activeTab === 'my-images' && (
                <div className="video-play-overlay">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="white" 
                    width="24" 
                    height="24"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                    }}
                  >
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              )}
            </>
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
        {/* Heart/like button for Explore tab, logged-in users only */}
        {activeTab === 'explore' && user && (
          <button
            className={`like-heart-btn${like.liked ? ' liked' : ''}`}
            onClick={e => handleToggleLike(e, image.id)}
            aria-label={like.liked ? 'Unlike' : 'Like'}
            tabIndex={0}
          >
            <HeartIcon
              width={20}
              height={16}
              fill={like.liked ? '#e0245e' : 'none'}
              stroke="#fff"
              style={{ display: 'block' }}
            />
            <span className="like-count">{like.count}</span>
          </button>
        )}
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
          {newImagesCount > 0 && (
            <span className="new-images-badge">
              +{newImagesCount}
            </span>
          )}
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
          style={{ gap: '2px' }}
        >
          {images.map(renderImage)}
        </Masonry>
      )}

      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-image-container" style={{position: 'relative'}}>
              {selectedImage.video_url ? (
                <>
                  {/* Mobile-only download/share button */}
                  {isMobile && (
                    <button
                      className="download-video-btn"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (
                          navigator.canShare &&
                          navigator.canShare({ files: [new File([], 'video.mp4')] })
                        ) {
                          try {
                            const response = await fetch(selectedImage.video_url);
                            const blob = await response.blob();
                            const file = new File([blob], 'video.mp4', { type: blob.type });
                            await navigator.share({
                              files: [file],
                              title: 'Share or Save Video',
                              text: 'Check out this video!',
                            });
                          } catch (err) {
                            alert('Sharing failed: ' + err.message);
                          }
                        } else {
                          // Fallback: trigger download
                          const link = document.createElement('a');
                          link.href = selectedImage.video_url;
                          link.download = 'video.mp4';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 10,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 20
                      }}
                      title="Share or Save video"
                    >
                      ⬇️
                    </button>
                  )}
                  <video
                    src={selectedImage.video_url}
                    controls
                    autoPlay
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </>
              ) : (
                <img 
                  src={selectedImage.s3_url || selectedImage.image_url} 
                  alt={selectedImage.prompt}
                  loading="lazy"
                />
              )}
            </div>
            <div className="modal-info">
              <div className="modal-header">
                <div className="modal-title">{selectedImage.video_url ? 'Video Details' : 'Image Details'}</div>
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
                {selectedImage.video_url && (
                  <div className="metadata-item">
                    <span className="metadata-label">Type</span>
                    <span className="metadata-value">Video</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
