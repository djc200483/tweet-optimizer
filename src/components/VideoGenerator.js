import React, { useState, useRef } from 'react';

const REPLICATE_API_TOKEN = process.env.REACT_APP_REPLICATE_API_TOKEN;
const REPLICATE_MODEL_VERSION = process.env.REACT_APP_REPLICATE_KLING_VERSION;
const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

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

    // Prepare input payload
    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: 0.5,
    };
    if (startImageData) {
      input.start_image = startImageData;
    }

    try {
      const response = await fetch(REPLICATE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: REPLICATE_MODEL_VERSION,
          input,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to start video generation');
      setPredictionId(data.id);
      pollPrediction(data.id);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  // Poll for prediction status
  const pollPrediction = async (id) => {
    setStatus('Generating video...');
    try {
      let done = false;
      while (!done) {
        const res = await fetch(`${REPLICATE_API_URL}/${id}`, {
          headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (data.status === 'succeeded') {
          setVideoUrl(data.output && data.output[0]);
          setStatus('');
          setIsLoading(false);
          done = true;
        } else if (data.status === 'failed') {
          setError('Video generation failed.');
          setStatus('');
          setIsLoading(false);
          done = true;
        } else {
          setStatus('Generating video...');
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }
      }
    } catch (err) {
      setError('Error polling video status.');
      setStatus('');
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
        <label>
          Duration
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            required
            style={{ width: '100%', borderRadius: 8, padding: 10, marginTop: 4, fontSize: 16 }}
          >
            {DURATIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={isLoading}
          style={{ background: 'linear-gradient(135deg, #00c2ff, #a855f7)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 18, cursor: 'pointer', marginTop: 8 }}
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>
      </form>
      {status && <div style={{ marginTop: 24, textAlign: 'center', color: '#a0a0b0' }}>{status}</div>}
      {error && <div style={{ marginTop: 24, color: '#ff6b6b', textAlign: 'center' }}>{error}</div>}
      {videoUrl && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <video src={videoUrl} controls style={{ width: '100%', borderRadius: 12, background: '#000' }} />
          <a href={videoUrl} download target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, color: '#00c2ff', fontWeight: 500 }}>
            Download Video
          </a>
        </div>
      )}
    </div>
  );
} 