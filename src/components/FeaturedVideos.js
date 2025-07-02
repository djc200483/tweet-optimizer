import React, { useState, useEffect, useCallback } from 'react';
import './ImageGallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const CACHE_KEY = 'featured_videos_cache';
const CACHE_TIMESTAMP_KEY = 'featured_videos_cache_timestamp';

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

export default function FeaturedVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const videosPerPage = 5;
  const totalPages = Math.ceil(videos.length / videosPerPage);

  const fetchFeaturedVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Check for cached data first
      const cachedData = getCachedData();
      if (cachedData) {
        setVideos(cachedData);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/featured-videos`);
      if (!response.ok) throw new Error('Failed to fetch featured videos');
      const data = await response.json();
      const videosData = data.videos || [];
      setVideos(videosData);
      // Cache the new data
      setCacheData(videosData);
    } catch (err) {
      setError('Failed to load featured videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedVideos();
  }, [fetchFeaturedVideos]);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const getCurrentVideos = () => {
    const startIndex = currentPage * videosPerPage;
    return videos.slice(startIndex, startIndex + videosPerPage);
  };

  const renderVideo = (video) => {
    return (
      <div 
        key={video.id} 
        className="featured-video-item"
        onClick={() => setSelectedVideo(video)}
        onMouseEnter={(e) => {
          const videoElement = e.currentTarget.querySelector('video');
          if (videoElement) {
            videoElement.play().catch(err => console.log('Video play failed:', err));
          }
        }}
        onMouseLeave={(e) => {
          const videoElement = e.currentTarget.querySelector('video');
          if (videoElement) {
            videoElement.pause();
            videoElement.currentTime = 0;
          }
        }}
      >
        <div className="featured-video-placeholder">
          <video
            src={video.video_url}
            muted
            loop
            playsInline
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="featured-videos">
        <div className="loading-container">Loading featured videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="featured-videos">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return null; // Don't render anything if no featured videos
  }

  const currentVideos = getCurrentVideos();
  const showPrevArrow = currentPage > 0;
  const showNextArrow = currentPage < totalPages - 1;

  return (
    <div className="featured-videos">
      <div className="featured-videos-container">
        {showPrevArrow && (
          <button 
            className="featured-videos-arrow featured-videos-arrow-left"
            onClick={handlePrevious}
            aria-label="Previous videos"
          >
            ‹
          </button>
        )}
        
        <div className="featured-videos-items">
          {currentVideos.map(renderVideo)}
        </div>
        
        {showNextArrow && (
          <button 
            className="featured-videos-arrow featured-videos-arrow-right"
            onClick={handleNext}
            aria-label="Next videos"
          >
            ›
          </button>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="image-modal" onClick={() => setSelectedVideo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-image-container">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
              />
            </div>
            <div className="modal-info">
              <div className="modal-header">
                <div className="modal-title">Video Details</div>
                <div className="modal-header-actions">
                  <button 
                    className="close-modal" 
                    onClick={() => setSelectedVideo(null)}
                  >×</button>
                </div>
              </div>
              <div className="modal-prompt-section">
                <div className="image-prompt">
                  {selectedVideo.prompt}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 