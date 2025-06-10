/*
import React, { useState, useRef } from 'react';
import { useAuth } from './auth/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ASPECT_RATIOS = [
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '1:1', value: '1:1' },
];
const DURATIONS = [
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
];

export default function VideoGenerator() {
  const { token } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);
  const [duration, setDuration] = useState(DURATIONS[0].value);
  const [startImage, setStartImage] = useState(null);
  const [startImageData, setStartImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [predictionId, setPredictionId] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef();

  // Convert image file to base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setStartImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStartImageData(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setStartImageData(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setVideoUrl('');
    setStatus('');
    setPredictionId('');

    try {
      const response = await fetch(`${API_URL}/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          duration,
          startImage: startImageData || undefined
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start video generation');
      if (!data.videos || !Array.isArray(data.videos)) throw new Error('Invalid response from server');
      setVideoUrl(data.videos[0]);
      setStatus('');
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="video-generator-page" style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: 'rgba(30,32,40,0.95)', borderRadius: 16, color: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 12 }}>Video Generator</h2>
      <p style={{ textAlign: 'center', color: '#a0a0b0', marginBottom: 24 }}>
        Generate short AI-powered videos from your prompts using Replicate's Kling model.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <label>
          Prompt
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            required
            rows={3}
            style={{ width: '100%', borderRadius: 8, padding: 10, marginTop: 4, fontSize: 16 }}
            placeholder="Describe your video..."
          />
        </label>
        <label>
          Aspect Ratio
          <select
            value={aspectRatio}
            onChange={e => setAspectRatio(e.target.value)}
            required
            style={{ width: '100%', borderRadius: 8, padding: 10, marginTop: 4, fontSize: 16 }}
          >
            {ASPECT_RATIOS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label>
          Start Image (optional)
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ marginTop: 4 }}
          />
        </label>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: 8,
            fontSize: 16,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>
      </form>

      {error && (
        <div style={{ color: '#ff6b6b', marginTop: 16, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {videoUrl && (
        <div style={{ marginTop: 24 }}>
          <video
            src={videoUrl}
            controls
            style={{ width: '100%', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}
*/ 