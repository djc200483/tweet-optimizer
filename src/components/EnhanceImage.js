import React, { useState } from 'react';
import './ImageGenerator.css';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import NavBar from './NavBar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
  React.useEffect(() => {
    if (originalS3 && enhancedS3) {
      setImagesLoaded(false); // Reset loading state
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          img.src = src;
        });
      };
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
    <>
      <NavBar />
      <div className="optimizer-container image-generator-page" style={{ marginTop: 50 }}>
        <div className="toolbar-card">
          <div className="left-toolbar">
            <div className="toolbar-scroll-content">
              <div className="toolbar-section">
                <h3 style={{ textAlign: 'center', width: '100%' }}>Enhance Image</h3>
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
                <label className="toolbar-label" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Model</label>
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
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="gallery-wrapper">
          <div className="generated-images-container">
            {originalS3 && enhancedS3 && imagesLoaded && (
              <div style={{ position: 'relative', width: '100%', height: 600 }}>
                {/* Before Label */}
                <div style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 16,
                  zIndex: 10
                }}>Before</div>
                {/* After Label */}
                <div style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 16,
                  zIndex: 10
                }}>After</div>
                <ReactCompareSlider
                  itemOne={<ReactCompareSliderImage src={originalS3} alt="Before" />}
                  itemTwo={<ReactCompareSliderImage src={enhancedS3} alt="After" />}
                  style={{ width: '100%', height: 600 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 