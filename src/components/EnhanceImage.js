import React, { useState, useRef, useEffect } from 'react';
import './ImageGenerator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Custom Before/After Slider Component
function BeforeAfterSlider({ beforeImage, afterImage }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateSliderPosition = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        height: '600px', // Fixed height for pixel-perfect overlay
        background: '#111',
        borderRadius: '8px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Before Image (Background) */}
      <img
        src={beforeImage}
        alt="Before"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          zIndex: 1,
        }}
        draggable={false}
      />
      {/* After Image (Overlay) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${sliderPosition}%`,
          height: '100%',
          overflow: 'hidden',
          zIndex: 2,
        }}
      >
        <img
          src={afterImage}
          alt="After"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            zIndex: 2,
          }}
          draggable={false}
        />
      </div>
      {/* Slider Handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${sliderPosition}%`,
          width: '4px',
          height: '100%',
          backgroundColor: '#fff',
          cursor: 'col-resize',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            backgroundColor: '#23242b',
            border: '3px solid #fff',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'col-resize',
            userSelect: 'none',
            touchAction: 'none',
            zIndex: 11,
          }}
        >
          ↔
        </div>
      </div>
      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 20,
        }}
      >
        Before
      </div>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 20,
        }}
      >
        After
      </div>
    </div>
  );
}

export default function EnhanceImage() {
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImagePreview, setSourceImagePreview] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [originalS3, setOriginalS3] = useState(null);
  const [enhancedS3, setEnhancedS3] = useState(null);
  const [scale, setScale] = useState(7);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Check if both images are loaded
  useEffect(() => {
    if (originalS3 && enhancedS3) {
      setImagesLoaded(false); // Reset loading state
      
      // Load images in parallel
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        });
      };

      // Load both images simultaneously
      Promise.all([
        loadImage(originalS3),
        loadImage(enhancedS3)
      ])
      .then(() => {
        setImagesLoaded(true);
      })
      .catch((error) => {
        console.error('Image loading error:', error);
        setImagesLoaded(false);
      });
    } else {
      setImagesLoaded(false);
    }
  }, [originalS3, enhancedS3]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (WebP, JPG, or PNG)');
      return;
    }
    setSourceImage(file);
    setSourceImagePreview(URL.createObjectURL(file));
    setError('');
    setEnhancedImage(null);
    setOriginalS3(null);
    setEnhancedS3(null);
    setImagesLoaded(false);
  };

  const handleRemoveImage = () => {
    if (sourceImagePreview) URL.revokeObjectURL(sourceImagePreview);
    setSourceImage(null);
    setSourceImagePreview(null);
    setEnhancedImage(null);
    setOriginalS3(null);
    setEnhancedS3(null);
    setImagesLoaded(false);
  };

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError('Please upload an image first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setEnhancedImage(null);
    setOriginalS3(null);
    setEnhancedS3(null);
    setImagesLoaded(false);
    try {
      // Convert image to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result.split(',')[1];
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(sourceImage);
      });
      // Get auth token from localStorage (or context if available)
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/enhance-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageBase64: base64,
          scale,
          face_enhance: faceEnhance
        })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to enhance image');
      }
      const data = await response.json();
      console.log('Setting images:', { original: data.original, enhanced: data.enhanced });
      setOriginalS3(data.original);
      setEnhancedS3(data.enhanced);
      setEnhancedImage(data.enhanced);
    } catch (err) {
      let msg = err.message || 'Failed to enhance image.';
      if (msg.includes('has a total number of pixels') && msg.includes('Resize input image and try again')) {
        msg = 'Image must have Square Dimensions';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="optimizer-container image-generator-page">
      <div className="left-toolbar">
        <div className="toolbar-scroll-content">
          <div className="toolbar-section">
            <h3>Enhance Image</h3>
            <div className="image-upload-container">
              {!sourceImagePreview ? (
                <div className="image-upload-box">
                  <input
                    type="file"
                    accept=".webp,.jpg,.jpeg,.png"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="image-upload-label">
                    <span>Click to upload image</span>
                    <span className="image-upload-hint">WebP, JPG, or PNG</span>
                  </label>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={sourceImagePreview} alt="Source" className="image-preview" />
                  <button onClick={handleRemoveImage} className="remove-image-button">Remove</button>
                </div>
              )}
            </div>
          </div>
          <div className="toolbar-section">
            <label className="toolbar-label">Model</label>
            <div className="model-select-header" style={{ background: '#23242b', color: '#aaa', cursor: 'not-allowed' }}>
              NightmareAI
            </div>
          </div>
          <div className="toolbar-section">
            <label className="toolbar-label">Scale</label>
            <input
              type="number"
              min={1}
              max={10}
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="model-select-header"
              style={{ width: '100px', background: '#23242b', color: '#fff' }}
            />
          </div>
          <div className="toolbar-section">
            <label className="toolbar-label">
              <input
                type="checkbox"
                checked={faceEnhance}
                onChange={e => setFaceEnhance(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Face Enhance
            </label>
          </div>
        </div>
        <div className="toolbar-footer">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !sourceImage}
            className="generate-flux-button"
          >
            {isLoading ? 'Enhancing...' : 'Generate'}
          </button>
        </div>
      </div>
      <div className="main-content">
        {error && <div className="error-message">{error}</div>}
        <div className="gallery-wrapper">
          {/* Before/After slider */}
          {originalS3 && enhancedS3 && (
            <div style={{ maxWidth: 600, margin: '40px auto' }}>
              {imagesLoaded ? (
                <BeforeAfterSlider 
                  beforeImage={originalS3}
                  afterImage={enhancedS3}
                />
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#fff',
                  background: '#23242b',
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '20px' }}>Loading comparison...</div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    border: '4px solid #333', 
                    borderTop: '4px solid #fff', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 