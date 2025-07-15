import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import './Admin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function FeaturedVideosManager({ isOpen, onClose, onSave }) {
  const { token } = useAuth();
  const [availableVideos, setAvailableVideos] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState('');
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const videoRefs = useRef([]);

  const fetchAvailableVideos = async (page = 1, search = '') => {
    try {
      const response = await fetch(
        `${API_URL}/admin/available-videos?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch available videos');
      const videos = await response.json();
      setAvailableVideos(videos);
      setTotalPages(Math.ceil(videos.length / 20));
    } catch (error) {
      console.error('Error fetching available videos:', error);
      setMessage('Error loading available videos');
    }
  };

  const fetchFeaturedVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/featured-videos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch featured videos');
      const videos = await response.json();
      setFeaturedVideos(videos);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      setMessage('Error loading featured videos');
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([
          fetchAvailableVideos(),
          fetchFeaturedVideos()
        ]);
        setLoading(false);
      };
      loadData();
    }
  }, [isOpen, token]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAvailableVideos(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchAvailableVideos(newPage, searchTerm);
  };

  const addToFeatured = (video) => {
    if (featuredVideos.length >= 10) {
      setMessage('Maximum 10 videos allowed in featured gallery');
      return;
    }
    
    if (featuredVideos.find(v => v.id === video.id)) {
      setMessage('Video already in featured gallery');
      return;
    }
    
    setFeaturedVideos(prev => [...prev, { ...video, position: prev.length + 1 }]);
    setMessage('Video added to featured gallery');
  };

  const removeFromFeatured = (videoId) => {
    setFeaturedVideos(prev => {
      const filtered = prev.filter(v => v.id !== videoId);
      // Reorder positions
      return filtered.map((v, index) => ({ ...v, position: index + 1 }));
    });
    setMessage('Video removed from featured gallery');
  };

  const moveVideo = (videoId, direction) => {
    setFeaturedVideos(prev => {
      const newVideos = [...prev];
      const currentIndex = newVideos.findIndex(v => v.id === videoId);
      
      if (direction === 'up' && currentIndex > 0) {
        [newVideos[currentIndex], newVideos[currentIndex - 1]] = 
        [newVideos[currentIndex - 1], newVideos[currentIndex]];
      } else if (direction === 'down' && currentIndex < newVideos.length - 1) {
        [newVideos[currentIndex], newVideos[currentIndex + 1]] = 
        [newVideos[currentIndex + 1], newVideos[currentIndex]];
      }
      
      // Update positions
      return newVideos.map((v, index) => ({ ...v, position: index + 1 }));
    });
  };

  const saveFeaturedVideos = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/admin/featured-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageIds: featuredVideos.map(v => v.id)
        })
      });
      
      if (!response.ok) throw new Error('Failed to save featured videos');
      
      setMessage('Featured videos saved successfully!');
      
      // Clear cache to force refresh
      localStorage.removeItem('featured_videos_cache');
      localStorage.removeItem('featured_videos_cache_timestamp');
      
      if (onSave) onSave();
      
    } catch (error) {
      console.error('Error saving featured videos:', error);
      setMessage('Error saving featured videos');
    } finally {
      setSaving(false);
    }
  };

  const clearCache = () => {
    localStorage.removeItem('featured_videos_cache');
    localStorage.removeItem('featured_videos_cache_timestamp');
    setMessage('Cache cleared successfully');
  };

  const toggleVideoPlay = (videoId, index) => {
    console.log('Toggle video play:', videoId, index);
    const videoElement = videoRefs.current[index];
    console.log('Video element:', videoElement);
    
    if (!videoElement) {
      console.log('No video element found');
      return;
    }

    if (playingVideos.has(videoId)) {
      console.log('Pausing video:', videoId);
      videoElement.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    } else {
      console.log('Playing video:', videoId);
      videoElement.play();
      setPlayingVideos(prev => new Set(prev).add(videoId));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="featured-videos-modal-overlay" onClick={onClose}>
      <div className="featured-videos-modal" onClick={e => e.stopPropagation()}>
        <div className="featured-videos-modal-header">
          <h2>Manage Featured Videos</h2>
          <button className="featured-videos-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="featured-videos-modal-content">
          {loading && <div className="admin-section">Loading...</div>}
      
      {message && (
        <div className={`admin-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      <div className="admin-controls">
        <button 
          onClick={saveFeaturedVideos} 
          disabled={saving}
          className="admin-button primary"
        >
          {saving ? 'Saving...' : 'Save Featured Videos'}
        </button>
        <button onClick={clearCache} className="admin-button secondary">
          Clear Cache
        </button>
      </div>

      <div className="featured-manager-container">
        {/* Current Featured Videos */}
        <div className="featured-current">
          <h3>Current Featured Videos ({featuredVideos.length}/10)</h3>
          <div className="featured-list">
            {featuredVideos.map((video, index) => (
              <div key={video.id} className="featured-item">
                <div className="featured-item-content">
                  <div className="featured-item-preview">
                    <video
                      src={video.video_url}
                      muted
                      loop
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="featured-item-info">
                    <div className="featured-item-prompt">{video.prompt}</div>
                    <div className="featured-item-meta">
                      {video.creator_handle && `by @${video.creator_handle}`}
                    </div>
                  </div>
                </div>
                <div className="featured-item-actions">
                  <button 
                    onClick={() => moveVideo(video.id, 'up')}
                    disabled={index === 0}
                    className="admin-button small"
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => moveVideo(video.id, 'down')}
                    disabled={index === featuredVideos.length - 1}
                    className="admin-button small"
                  >
                    ↓
                  </button>
                  <button 
                    onClick={() => removeFromFeatured(video.id)}
                    className="admin-button small danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {featuredVideos.length === 0 && (
              <div className="featured-empty">No featured videos selected</div>
            )}
          </div>
        </div>

        {/* Available Videos */}
        <div className="featured-available">
          <h3>Available Videos (Last 20 Days)</h3>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search prompts..."
              className="search-input"
            />
            <button type="submit" className="admin-button">Search</button>
          </form>

          <div className="available-list">
            {availableVideos.map((video, index) => (
              <div key={video.id} className="available-item">
                <div className="available-item-content">
                  <div className="available-item-preview" style={{ position: 'relative' }}>
                    <video
                      ref={el => {
                        videoRefs.current[index] = el;
                        console.log('Video ref set for index:', index, 'video:', video.id, 'element:', el);
                      }}
                      src={video.video_url}
                      muted
                      loop
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button 
                      className="video-play-button"
                      onClick={() => toggleVideoPlay(video.id, index)}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                    >
                      {playingVideos.has(video.id) ? '⏸️' : '▶️'}
                    </button>
                  </div>
                  <div className="available-item-info">
                    <div className="available-item-prompt">{video.prompt}</div>
                    <div className="available-item-meta">
                      {video.creator_handle && `by @${video.creator_handle}`}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => addToFeatured(video)}
                  disabled={featuredVideos.find(v => v.id === video.id)}
                  className="admin-button small"
                >
                  {featuredVideos.find(v => v.id === video.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="admin-button small"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="admin-button small"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
} 