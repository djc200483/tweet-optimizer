import React, { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from './auth/AuthContext';
import ImageGallery from './ImageGallery';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import './ImageGenerator.css';
import ReactDOM from 'react-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function ImageGenerator() {
  const { token, user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [generationType, setGenerationType] = useState('text-to-image');
  const [sourceImage, setSourceImage] = useState(null);
  const [sourceImagePreview, setSourceImagePreview] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showImageGrid, setShowImageGrid] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSuperchargeModalOpen, setIsSuperchargeModalOpen] = useState(false);
  const [superchargedPrompt, setSuperchargedPrompt] = useState('');
  const [isSuperchargeLoading, setIsSuperchargeLoading] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [assistantSelectedOptions, setAssistantSelectedOptions] = useState({
    subject: { main: '', sub: '' },
    resolution: '',
    style: { main: '', sub: '' },
    emotion: { main: '', sub: '' },
    lighting: { main: '', sub: '' },
    composition: { main: '', sub: '' },
    timePeriod: { main: '', sub: '' },
    extraDetails: { main: '', sub: '' }
  });
  const [assistantGeneratedPrompt, setAssistantGeneratedPrompt] = useState('');
  const [assistantCollapsedSections, setAssistantCollapsedSections] = useState({});
  const [assistantSelectionOrder, setAssistantSelectionOrder] = useState([]);

  // Enhance functionality states
  const [isEnhanceMode, setIsEnhanceMode] = useState(false);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [originalS3, setOriginalS3] = useState(null);
  const [enhancedS3, setEnhancedS3] = useState(null);
  const [scale, setScale] = useState(7);
  const [faceEnhance, setFaceEnhance] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Video generation states
  const [isVideoGenerationLoading, setIsVideoGenerationLoading] = useState(false);
  const [videoPredictionId, setVideoPredictionId] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoRemaining, setVideoRemaining] = useState(3);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [currentVideoStep, setCurrentVideoStep] = useState(0);
  const [videoStepText, setVideoStepText] = useState('');

  // Video generation steps with percentages
  const videoSteps = [
    { text: "Uploading image...", percentage: 10 },
    { text: "Initializing video generation...", percentage: 25 },
    { text: "Processing video (this may take 2-3 minutes)...", percentage: 75 },
    { text: "Finalizing video...", percentage: 90 },
    { text: "Complete!", percentage: 100 }
  ];

  const allModels = [
    { value: 'black-forest-labs/flux-schnell', label: 'Flux Schnell', description: 'Lightning‑fast text-to-image generation—ideal for quick prototyping' },
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro', description: 'High-quality, fast text-to-image model balancing image fidelity with prompt accuracy.' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra', description: 'Ultra‑high resolution images quickly, with photoreal realism.' },
    { value: 'google/imagen-4', label: 'Imagen 4', description: 'Top-tier photorealism, sharp detail and typography.' },
    { value: 'minimax/image-01', label: 'MiniMax 01', description: 'High Quality Text-to-image model' },
    { value: 'recraft-ai/recraft-v3', label: 'Recraft V3', description: 'High-quality image generation with style control.' },
    { value: 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe', label: 'bytedance', description: 'Lightning Fast image generation' }
  ];

  const imageToImageModels = [
    { value: 'black-forest-labs/flux-1.1-pro', label: 'Flux 1.1 Pro', description: 'High-quality, fast text-to-image model balancing image fidelity with prompt accuracy.' },
    { value: 'black-forest-labs/flux-1.1-pro-ultra', label: 'Flux 1.1 Pro Ultra', description: 'Ultra‑high resolution images quickly, with photoreal realism.' },
    { value: 'minimax/image-01', label: 'MiniMax 01', description: 'High Quality Text-to-image model' },
    { value: 'flux-kontext-apps/portrait-series', label: 'Portrait Series (Flux Kontext)', description: 'Generates diverse portrait variations from one photo.' }
  ];

  const portraitBackgroundColors = [
    { value: 'white', label: 'White' },
    { value: 'black', label: 'Black' },
    { value: 'gray', label: 'Gray' },
    { value: 'green screen', label: 'Green Screen' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'original', label: 'Original' }
  ];

  const [portraitBackground, setPortraitBackground] = useState('white');

  const models = generationType === 'image-to-image' ? imageToImageModels : allModels;

  const naturalAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '21:9', label: 'Ultrawide (21:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '9:21', label: 'Tall Vertical (9:21)' }
  ];

  const flux11ProAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Standard (4:3)' }
  ];

  const imagen4AspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '9:16', label: 'Vertical (9:16)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:3', label: 'Standard (4:3)' }
  ];

  const minimaxAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '21:9', label: 'Ultrawide (21:9)' }
  ];

  const recraftAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '1:2', label: 'Tall (1:2)' },
    { value: '2:1', label: 'Wide (2:1)' },
    { value: '7:5', label: '7:5' },
    { value: '5:7', label: '5:7' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '5:4', label: 'Large Format (5:4)' },
    { value: '3:5', label: '3:5' },
    { value: '5:3', label: '5:3' }
  ];

  const aspectRatios = {
    'black-forest-labs/flux-schnell': naturalAspectRatios,
    'black-forest-labs/flux-1.1-pro': flux11ProAspectRatios,
    'black-forest-labs/flux-1.1-pro-ultra': naturalAspectRatios,
    'google/imagen-4': imagen4AspectRatios,
    'minimax/image-01': minimaxAspectRatios,
    'recraft-ai/recraft-v3': recraftAspectRatios,
    'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe': [{ value: '1:1', label: 'Square (1:1)' }]
  };

  const defaultModel = 'black-forest-labs/flux-schnell';
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[defaultModel][0].value);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isGenerationTypeDropdownOpen, setIsGenerationTypeDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false);
  const backgroundHeaderRef = useRef(null);
  const [backgroundDropdownPos, setBackgroundDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [selectedStyle, setSelectedStyle] = useState('realistic_image');
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isSourceImageDropdownOpen, setIsSourceImageDropdownOpen] = useState(false);

  // Add state for Expand mode
  const [isExpandMode, setIsExpandMode] = useState(false);

  // Aspect ratios for Expand
  const expandAspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:2', label: 'Classic Photo (3:2)' },
    { value: '2:3', label: 'Portrait Classic (2:3)' },
    { value: '9:16', label: 'Vertical Video (9:16)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '4:5', label: 'Portrait (4:5)' },
    { value: '5:4', label: 'Large Format (5:4)' }
  ];

  // Clear prompt and aspect ratio if Portrait Series model is selected
  useEffect(() => {
    if (generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') {
      setPrompt('');
      setSelectedAspectRatio('');
    }
  }, [generationType, selectedModel]);

  // Clear prompt if Portrait Series model is selected
  useEffect(() => {
    if (generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') {
      setPrompt('');
    }
  }, [generationType, selectedModel]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    adjustTextareaHeight();
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight();
    }
  }, []);

  const handleGenerateWithFlux = async () => {
    if (!prompt.trim() && generationType !== 'image-to-prompt') {
      setError('Please enter a prompt');
      return;
    }

    if (generationType === 'image-to-image' && !sourceImage) {
      setError('Please upload a source image');
      return;
    }

    if (generationType === 'image-to-video' && !sourceImage) {
      setError('Please upload a source image for video generation');
      return;
    }

    if (generationType === 'image-to-image' && isExpandMode) {
      setIsGenerateLoading(true);
      setError('');
      setGeneratedImages([]);
      try {
        // Upload image to S3 (reuse your existing upload logic)
        const convertToBase64 = (file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              const base64String = reader.result.split(',')[1];
              resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
          });
        };
        const base64Image = await convertToBase64(sourceImage);
        // Call your backend to upload to S3 and get the URL (reuse your existing endpoint)
        const uploadResponse = await fetch(`${API_URL}/api/upload-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ imageBase64: base64Image })
        });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
        const { s3Url } = await uploadResponse.json();
        // Call Replicate with bria/expand-image
        const replicateResponse = await fetch(`${API_URL}/api/expand-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            model: 'bria/expand-image',
            sync: true,
            image: s3Url,
            aspect_ratio: selectedAspectRatio,
            preserve_alpha: true,
            content_moderation: false
          })
        });
        if (!replicateResponse.ok) {
          const errorData = await replicateResponse.json();
          throw new Error(errorData.error || 'Failed to expand image');
        }
        const data = await replicateResponse.json();
        setGeneratedImages(data.images || [data]);
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error('Expand error:', err);
        setError(err.message || 'Failed to expand image');
      } finally {
        setIsGenerateLoading(false);
      }
      return;
    }

    setIsGenerateLoading(true);
    setError('');
    setGeneratedImages([]);

    try {
      let requestBody = {
        prompt: prompt.trim(),
        model: selectedModel,
        aspectRatio: selectedAspectRatio,
        style: selectedStyle
      };

      if (generationType === 'image-to-image') {
        requestBody.generation_type = 'image-to-image';
        // Convert sourceImage to base64 if present
        if (sourceImage) {
          const convertToBase64 = (file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                // Remove the data:image/jpeg;base64, prefix
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
              };
              reader.onerror = (error) => reject(error);
            });
          };
          requestBody.sourceImageBase64 = await convertToBase64(sourceImage);
        } else {
          requestBody.sourceImageBase64 = null;
        }
        if (selectedModel === 'flux-kontext-apps/portrait-series') {
          requestBody.background_color = portraitBackground;
        }
      } else if (generationType === 'image-to-prompt') {
        requestBody.generation_type = 'image-to-prompt';
        requestBody.source_image = sourceImage;
      } else if (generationType === 'image-to-video') {
        // Handle video generation
        await handleVideoGeneration();
        return;
      } else {
        requestBody.generation_type = 'text-to-image';
      }

      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImages(data.images || [data]);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setIsGenerateLoading(false);
    }
  };

  const handleVideoGeneration = async () => {
    setIsVideoGenerationLoading(true);
    setError('');
    setCurrentVideoStep(0);
    setVideoProgress(0);
    setVideoStepText(videoSteps[0].text);

    try {
      // Step 1: Uploading image (0-10%)
      setCurrentVideoStep(0);
      setVideoProgress(5);
      setVideoStepText(videoSteps[0].text);

      // Convert source image to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            // Remove the data:image/jpeg;base64, prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = (error) => reject(error);
        });
      };

      const base64Image = await convertToBase64(sourceImage);
      setVideoProgress(10);

      // Step 2: Initializing video generation (10-25%)
      setCurrentVideoStep(1);
      setVideoProgress(15);
      setVideoStepText(videoSteps[1].text);

      // Start video generation
      const response = await fetch(`${API_URL}/api/images/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl: base64Image,
          prompt: prompt.trim(),
          cameraFixed: cameraFixed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      setVideoPredictionId(data.prediction_id);
      setVideoRemaining(data.remaining);
      setVideoProgress(25);

      // Step 3: Start polling for status (25-75%)
      setCurrentVideoStep(2);
      setVideoStepText(videoSteps[2].text);
      pollVideoStatus(data.prediction_id);
    } catch (err) {
      console.error('Video generation error:', err);
      setError(err.message || 'Failed to start video generation');
      setIsVideoGenerationLoading(false);
      setCurrentVideoStep(0);
      setVideoProgress(0);
      setVideoStepText('');
    }
  };

  const pollVideoStatus = async (predictionId) => {
    let pollCount = 0;
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        
        // Gradually increase progress from 25% to 75% during polling
        const progressIncrement = 50 / 90; // 50% spread over ~90 polls (3 minutes at 2-second intervals)
        const currentProgress = Math.min(25 + (pollCount * progressIncrement), 75);
        setVideoProgress(currentProgress);

        const response = await fetch(`${API_URL}/api/images/video-status/${predictionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to check video status');
        }

        const data = await response.json();

        if (data.status === 'completed') {
          // Step 4: Finalizing (75-90%)
          setCurrentVideoStep(3);
          setVideoProgress(85);
          setVideoStepText(videoSteps[3].text);
          
          // Step 5: Complete (90-100%)
          setTimeout(() => {
            setCurrentVideoStep(4);
            setVideoProgress(100);
            setVideoStepText(videoSteps[4].text);
            
            // Clear everything after showing completion
            setTimeout(() => {
              clearInterval(pollInterval);
              setIsVideoGenerationLoading(false);
              setVideoPredictionId(null);
              setVideoProgress(0);
              setCurrentVideoStep(0);
              setVideoStepText('');
              setRefreshTrigger(prev => prev + 1);
              // Show success message and clear it after 5 seconds
              setError('Video generated successfully! Check your gallery.');
              setTimeout(() => {
                setError('');
              }, 5000);
            }, 1000);
          }, 500);
        } else if (data.status === 'failed') {
          clearInterval(pollInterval);
          setIsVideoGenerationLoading(false);
          setVideoPredictionId(null);
          setVideoProgress(0);
          setCurrentVideoStep(0);
          setVideoStepText('');
          setError(data.error || 'Video generation failed');
        }
        // If still processing, continue with gradual progress increase
      } catch (err) {
        clearInterval(pollInterval);
        setIsVideoGenerationLoading(false);
        setVideoPredictionId(null);
        setVideoProgress(0);
        setCurrentVideoStep(0);
        setVideoStepText('');
        setError('Failed to check video status');
      }
    }, 2000); // Poll every 2 seconds
  };

  const getRemainingVideoGenerations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images/video-remaining`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVideoRemaining(data.remaining);
      }
    } catch (err) {
      console.error('Failed to get remaining video generations:', err);
    }
  };

  // Load remaining video generations on component mount
  useEffect(() => {
    if (token && generationType === 'image-to-video') {
      getRemainingVideoGenerations();
    }
  }, [token, generationType]);

  const handleKeyDown = (e) => {
    // Prevent page scroll when using arrow keys in textarea
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
      e.stopPropagation();
    }
  };

  const handleWheel = (e) => {
    // If the textarea can scroll (content height > visible height)
    if (e.target.scrollHeight > e.target.clientHeight) {
      e.stopPropagation();
    }
  };

  const handleTouchStart = (e) => {
    // Store the initial touch position and scroll position
    e.target.dataset.touchStartY = e.touches[0].clientY;
    e.target.dataset.scrollTop = e.target.scrollTop;
  };

  const handleTouchMove = (e) => {
    const textarea = e.target;
    const touchStartY = parseFloat(textarea.dataset.touchStartY);
    const touchEndY = e.touches[0].clientY;
    const deltaY = touchStartY - touchEndY;
    const scrollTop = parseFloat(textarea.dataset.scrollTop);

    // If the textarea has scrollable content
    if (textarea.scrollHeight > textarea.clientHeight) {
      // If we're at the top and trying to scroll up, or at the bottom and trying to scroll down
      if ((textarea.scrollTop <= 0 && deltaY < 0) || 
          (textarea.scrollTop >= textarea.scrollHeight - textarea.clientHeight && deltaY > 0)) {
        // Let the page scroll
        return;
      }
      // Otherwise, prevent page scroll and let the textarea scroll
      e.stopPropagation();
    }
  };

  const handleGenerationTypeChange = (e) => {
    const newType = e.target.value;
    setGenerationType(newType);
    
    // Reset enhance and expand modes when changing generation type
    setIsEnhanceMode(false);
    setIsExpandMode(false);
    
    // If switching to image-to-image and current model isn't supported, switch to first supported model
    if (newType === 'image-to-image' && !imageToImageModels.some(model => model.value === selectedModel)) {
      setSelectedModel(imageToImageModels[0].value);
      setSelectedAspectRatio(aspectRatios[imageToImageModels[0].value][0].value);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (WebP, JPG, or PNG)');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSourceImage(file);
    setSourceImagePreview(previewUrl);
    setError('');
  };

  const handleRemoveImage = () => {
    if (sourceImagePreview) {
      URL.revokeObjectURL(sourceImagePreview);
    }
    setSourceImage(null);
    setSourceImagePreview(null);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSupercharge = async () => {
    if (!prompt) {
      setError('Please enter a prompt to supercharge.');
      return;
    }
    try {
      setIsSuperchargeLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/rewrite-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          tweet: prompt,
          tone: 'hyper-detailed',
          hook: 'descriptive',
          customInstructions: `Transform this image generation prompt into an extensively detailed masterpiece. 
            While preserving the core elements, significantly expand the description with:
            - Rich, intricate details about textures, materials, and surfaces (e.g., weathered metal, glossy reflections, rough stone)
            - Comprehensive lighting information (quality, direction, color, shadows, highlights)
            - Atmospheric and environmental details (particles, air quality, weather effects)
            - Specific color palettes and their interactions
            - Detailed spatial relationships and composition elements
            - Precise descriptions of any patterns, decorative elements, or unique features
            - Mood-enhancing environmental details (temperature, time of day, season)
            Feel free to be creative and expansive while maintaining the original intent and style.
            The goal is to create a prompt that would give an AI image generator enough detail to create a stunning, precise image.`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to supercharge prompt');
      }
      
      const data = await response.json();
      if (!data.rewrittenTweets || !data.rewrittenTweets.length) {
        throw new Error('Invalid response format from server');
      }
      
      setSuperchargedPrompt(data.rewrittenTweets[0]);
      setIsSuperchargeModalOpen(true);
    } catch (error) {
      console.error('Error supercharging prompt:', error);
      setError(error.message || 'Failed to supercharge prompt. Please try again.');
    } finally {
      setIsSuperchargeLoading(false);
    }
  };

  const handleUseSuperchargedPrompt = () => {
    setPrompt(superchargedPrompt);
    adjustTextareaHeight();
    setIsSuperchargeModalOpen(false);
  };

  const handleCloseSuperchargeModal = () => {
    setIsSuperchargeModalOpen(false);
  };

  // When opening the background dropdown, calculate its position
  const openBackgroundDropdown = () => {
    if (backgroundHeaderRef.current) {
      const rect = backgroundHeaderRef.current.getBoundingClientRect();
      setBackgroundDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsBackgroundDropdownOpen(true);
  };

  // User-friendly style labels for recraft
  const recraftStyles = [
    { value: 'realistic_image', label: 'Realistic Image' },
    { value: 'digital_illustration', label: 'Digital Illustration' },
    { value: 'digital_illustration/pixel_art', label: 'Pixel Art' },
    { value: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
    { value: 'digital_illustration/grain', label: 'Grain Illustration' },
    { value: 'digital_illustration/infantile_sketch', label: 'Infantile Sketch' },
    { value: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
    { value: 'digital_illustration/handmade_3d', label: 'Handmade 3D' },
    { value: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
    { value: 'digital_illustration/engraving_color', label: 'Engraving Color' },
    { value: 'digital_illustration/2d_art_poster_2', label: '2D Art Poster 2' },
    { value: 'realistic_image/b_and_w', label: 'Black & White' },
    { value: 'realistic_image/hard_flash', label: 'Hard Flash' },
    { value: 'realistic_image/hdr', label: 'HDR' },
    { value: 'realistic_image/natural_light', label: 'Natural Light' },
    { value: 'realistic_image/studio_portrait', label: 'Studio Portrait' },
    { value: 'realistic_image/enterprise', label: 'Enterprise' },
    { value: 'realistic_image/motion_blur', label: 'Motion Blur' }
  ];

  const handleSourceImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (WebP, JPG, or PNG)');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setSourceImage(file);
    setSourceImagePreview(previewUrl);
    setError('');
  };

  const handleAssistant = () => {
    setIsAssistantModalOpen(true);
  };

  const handleCloseAssistantModal = () => {
    setIsAssistantModalOpen(false);
  };

  const handleUseAssistantPrompt = () => {
    setPrompt(assistantGeneratedPrompt);
    setIsAssistantModalOpen(false);
  };

  const assistantCategories = {
    subject: {
      title: 'Subject Matter',
      main: [
        'Nature', 'Animals', 'People', 'Architecture', 'Technology', 'History', 'Fantasy', 'Mythology', 'Horror', 'Abstract'
      ],
      sub: {
        'Nature': ['Forests and Woodlands', 'Oceanic Landscapes', 'Mountain Ranges', 'Deserts and Sand Dunes', 'Waterfalls and Rivers', 'Flower Fields', 'Tropical Rainforests', 'Autumn Leaves', 'Snowy Landscapes', 'Night Skies'],
        'Animals': ['Wild Mammals', 'Birds in Flight', 'Marine Life', 'Reptiles and Amphibians', 'Insects and Butterflies', 'Pets and Domesticated Animals', 'Predators in the Wild', 'Endangered Species', 'Wildlife in Action', 'Animal Behavior'],
        'People': ['Portraits of Individuals', 'Group Gatherings', 'Historical Figures', 'Everyday Life', 'Mythical Creatures and Gods', 'Human Emotions and Expressions', 'Fashion and Clothing', 'Cultural Traditions', 'Vintage and Retro People', 'Social Interaction'],
        'Architecture': ['Ancient Ruins', 'Modern Cityscapes', 'Gothic Cathedrals', 'Futuristic Buildings', 'Traditional Houses and Villages', 'Ancient Temples and Pyramids', 'Castles and Fortresses', 'City Skylines', 'Urban Streetscapes', 'Rural Architecture'],
        'Technology': ['Robots and AI', 'Space Exploration', 'Futuristic Gadgets', 'Virtual Reality Landscapes', 'Machines in Motion', 'Cybernetic Augmentation', 'Electric Vehicles', 'Drones and Aerial Devices', 'Nanotechnology', 'Smart Cities'],
        'History': ['Ancient Civilizations', 'Wars and Conflicts', 'Cultural Evolution', 'Historical Reenactments', 'Industrial Revolution', 'Victorian Era', 'Medieval Times', '20th Century History', 'The Renaissance', 'Colonial Times'],
        'Fantasy': ['Magical Realms', 'Dragons and Mythical Beasts', 'Elven Forests', 'Enchanted Castles', 'Wizards and Sorcery', 'Fairy Tales', 'Fantasy Creatures', 'Magic in Everyday Life', 'Mythical Heroes and Legends', 'Magical Artifacts'],
        'Mythology': ['Greek Gods and Heroes', 'Norse Myths and Legends', 'Egyptian Deities and Pharaohs', 'Celtic Folk Tales', 'Native American Spirits', 'African Folklore', 'South American Legends', 'Polynesian Mythology', 'Asian Deities and Spirits', 'Aboriginal Mythology'],
        'Horror': ['Haunted Houses', 'Monsters and Creatures', 'Supernatural Entities', 'Dark Forests and Swamps', 'Paranormal Events', 'Ghosts and Spirits', 'Creepy Dolls and Objects', 'Occult Rituals', 'Witches and Magic', 'Psychological Horror'],
        'Abstract': ['Geometric Shapes and Patterns', 'Color Theory Experiments', 'Surreal Dreamscapes', 'Non-representational Forms', 'Emotional Expression through Art', 'Organic and Fluid Forms', 'Minimalist Designs', 'Conceptual Art', 'Movement and Motion in Art', 'Abstract Faces and Figures']
      }
    },
    style: {
      title: 'Style & Medium',
      options: [
        { main: 'Photorealistic', subcategories: ['Portrait Photography', 'Landscape Photography', 'Street Photography', 'Architectural Photography', 'Nature Photography', 'Documentary Style', 'Fashion Photography', 'Sports Photography', 'Macro Photography', 'Aerial Photography'] },
        { main: 'Digital Art', subcategories: ['Concept Art', 'Character Design', 'Environment Design', 'Digital Painting', '3D Renders', 'Pixel Art', 'Vector Graphics', 'Digital Illustration', 'Matte Painting', 'Digital Sculpting'] },
        { main: 'Traditional Art', subcategories: ['Oil Painting', 'Watercolor', 'Acrylic Painting', 'Charcoal Drawing', 'Pencil Sketch', 'Ink Drawing', 'Pastel Art', 'Gouache Painting', 'Mixed Media', 'Sculpture'] },
        { main: 'Cinematic', subcategories: ['Film Noir', 'Sci-Fi Movie', 'Fantasy Epic', 'Documentary', 'Action Movie', 'Romantic Comedy', 'Horror Film', 'Western', 'War Movie', 'Musical'] },
        { main: 'Artistic Styles', subcategories: ['Impressionism', 'Expressionism', 'Surrealism', 'Cubism', 'Art Nouveau', 'Art Deco', 'Renaissance', 'Baroque', 'Modernism', 'Contemporary Art'] }
      ]
    },
    emotion: {
      title: 'Emotion & Mood',
      options: [
        { main: 'Peaceful', subcategories: ['Serene', 'Tranquil', 'Calm', 'Relaxed', 'Meditative', 'Zen-like', 'Harmonious', 'Balanced', 'Gentle', 'Soothing'] },
        { main: 'Energetic', subcategories: ['Dynamic', 'Vibrant', 'Lively', 'Energetic', 'Powerful', 'Intense', 'Passionate', 'Exciting', 'Thrilling', 'Electric'] },
        { main: 'Mysterious', subcategories: ['Enigmatic', 'Cryptic', 'Puzzling', 'Intriguing', 'Bewildering', 'Perplexing', 'Confusing', 'Unclear', 'Ambiguous', 'Vague'] },
        { main: 'Melancholic', subcategories: ['Sad', 'Sorrowful', 'Gloomy', 'Depressing', 'Dismal', 'Cheerless', 'Dreary', 'Bleak', 'Desolate', 'Forlorn'] },
        { main: 'Joyful', subcategories: ['Happy', 'Cheerful', 'Delighted', 'Pleased', 'Content', 'Satisfied', 'Grateful', 'Thankful', 'Appreciative', 'Blessed'] }
      ]
    },
    lighting: {
      title: 'Lighting & Atmosphere',
      options: [
        { main: 'Natural Light', subcategories: ['Sunlight', 'Moonlight', 'Starlight', 'Dawn Light', 'Dusk Light', 'Overcast', 'Shade', 'Reflected Light', 'Diffused Light', 'Golden Hour'] },
        { main: 'Artificial Light', subcategories: ['Neon Lights', 'LED Lighting', 'Incandescent', 'Fluorescent', 'Candlelight', 'Firelight', 'Spotlight', 'Ambient Lighting', 'Studio Lighting', 'Street Lights'] },
        { main: 'Dramatic Lighting', subcategories: ['High Contrast', 'Low Key', 'High Key', 'Rim Lighting', 'Backlighting', 'Side Lighting', 'Top Lighting', 'Bottom Lighting', 'Split Lighting', 'Broad Lighting'] },
        { main: 'Atmospheric Effects', subcategories: ['Fog', 'Mist', 'Haze', 'Smoke', 'Dust', 'Rain', 'Snow', 'Clouds', 'Vapor', 'Steam'] },
        { main: 'Color Temperature', subcategories: ['Warm Light', 'Cool Light', 'Neutral Light', 'Colored Light', 'Mixed Lighting', 'Dynamic Lighting', 'Static Lighting', 'Pulsing Light', 'Flickering Light', 'Steady Light'] }
      ]
    },
    composition: {
      title: 'Composition & Perspective',
      options: [
        { main: 'Camera Angles', subcategories: ['Eye Level', 'Low Angle', 'High Angle', 'Bird\'s Eye View', 'Worm\'s Eye View', 'Dutch Angle', 'Canted Angle', 'Straight On', 'Profile View', 'Three-Quarter View'] },
        { main: 'Framing', subcategories: ['Close-up', 'Medium Shot', 'Long Shot', 'Extreme Close-up', 'Wide Shot', 'Establishing Shot', 'Over-the-Shoulder', 'Point of View', 'Reaction Shot', 'Insert Shot'] },
        { main: 'Composition Rules', subcategories: ['Rule of Thirds', 'Golden Ratio', 'Symmetry', 'Asymmetry', 'Leading Lines', 'Framing', 'Depth of Field', 'Foreground', 'Background', 'Midground'] },
        { main: 'Perspective', subcategories: ['One Point', 'Two Point', 'Three Point', 'Isometric', 'Oblique', 'Aerial', 'Ground Level', 'Elevated', 'Underwater', 'Through Window'] },
        { main: 'Focus', subcategories: ['Sharp Focus', 'Soft Focus', 'Selective Focus', 'Deep Focus', 'Shallow Focus', 'Bokeh', 'Motion Blur', 'Tilt Shift', 'Macro Focus', 'Infinity Focus'] }
      ]
    },
    timePeriod: {
      title: 'Time Period',
      options: [
        { main: 'Ancient Times', subcategories: ['Prehistoric', 'Ancient Egypt', 'Ancient Greece', 'Ancient Rome', 'Mesopotamia', 'Ancient China', 'Ancient India', 'Maya Civilization', 'Aztec Empire', 'Inca Empire'] },
        { main: 'Medieval', subcategories: ['Early Middle Ages', 'High Middle Ages', 'Late Middle Ages', 'Byzantine Empire', 'Islamic Golden Age', 'Mongol Empire', 'Crusades', 'Feudal Japan', 'Medieval Europe', 'Medieval Asia'] },
        { main: 'Renaissance', subcategories: ['Italian Renaissance', 'Northern Renaissance', 'Early Renaissance', 'High Renaissance', 'Late Renaissance', 'Renaissance Architecture', 'Renaissance Art', 'Renaissance Fashion', 'Renaissance Technology', 'Renaissance Culture'] },
        { main: 'Modern Era', subcategories: ['Industrial Revolution', 'Victorian Era', 'Edwardian Era', 'Art Nouveau Period', 'Art Deco Period', 'Modernism', 'Postmodernism', 'Contemporary', 'Digital Age', 'Information Age'] },
        { main: 'Future', subcategories: ['Near Future', 'Far Future', 'Dystopian Future', 'Utopian Future', 'Space Age', 'Cyberpunk', 'Steampunk', 'Post-apocalyptic', 'Transhumanist', 'Interstellar'] }
      ]
    },
    extraDetails: {
      title: 'Extra Details',
      options: [
        { main: 'Weather', subcategories: ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Stormy', 'Foggy', 'Windy', 'Calm', 'Humid', 'Dry'] },
        { main: 'Season', subcategories: ['Spring', 'Summer', 'Autumn', 'Winter', 'Monsoon', 'Dry Season', 'Wet Season', 'Growing Season', 'Harvest Season', 'Holiday Season'] },
        { main: 'Time of Day', subcategories: ['Dawn', 'Morning', 'Noon', 'Afternoon', 'Dusk', 'Evening', 'Night', 'Midnight', 'Early Morning', 'Late Night'] },
        { main: 'Location', subcategories: ['Urban', 'Rural', 'Suburban', 'Coastal', 'Mountainous', 'Desert', 'Forest', 'Arctic', 'Tropical', 'Temperate'] },
        { main: 'Atmosphere', subcategories: ['Peaceful', 'Busy', 'Lonely', 'Crowded', 'Quiet', 'Noisy', 'Romantic', 'Mysterious', 'Dangerous', 'Safe'] }
      ]
    },
    resolution: {
      title: 'Resolution',
      options: ['4K Ultra HD', '8K Ultra HD', 'High Definition', 'Standard Definition', 'Cinematic', 'Photographic', 'Print Quality', 'Web Optimized', 'Mobile Optimized', 'Retina Display']
    }
  };

  const generateAssistantPrompt = () => {
    let prompt = '';
    
    // Build prompt based on selection order
    assistantSelectionOrder.forEach(category => {
      if (category === 'resolution') {
        if (assistantSelectedOptions.resolution) {
          prompt += prompt ? `, ${assistantSelectedOptions.resolution}` : assistantSelectedOptions.resolution;
        }
      } else {
        const option = assistantSelectedOptions[category];
        if (option.main) {
          prompt += prompt ? `, ${option.main}` : option.main;
          if (option.sub) {
            prompt += `, ${option.sub}`;
          }
        }
      }
    });

    return prompt.trim();
  };

  useEffect(() => {
    const newPrompt = generateAssistantPrompt();
    setAssistantGeneratedPrompt(newPrompt);
  }, [assistantSelectedOptions, assistantSelectionOrder]);

  const handleAssistantOptionChange = (category, type, value) => {
    setAssistantSelectedOptions(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value
      }
    }));

    // Track selection order
    if (value && !assistantSelectionOrder.includes(category)) {
      setAssistantSelectionOrder(prev => [...prev, category]);
    }
  };

  const handleResolutionChange = (value) => {
    setAssistantSelectedOptions(prev => ({
      ...prev,
      resolution: value
    }));

    // Track selection order for resolution
    if (value && !assistantSelectionOrder.includes('resolution')) {
      setAssistantSelectionOrder(prev => [...prev, 'resolution']);
    }
  };

  const toggleAssistantSection = (section) => {
    setAssistantCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if both images are loaded for enhance mode
  useEffect(() => {
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

  return (
    <div className="optimizer-container image-generator-page">
      <div className="left-toolbar">
        <div className="toolbar-scroll-content">
          <div className="toolbar-section">
            <h3>Generation Type</h3>
            <div className="model-select-container">
              <div
                className="model-select-header"
                onClick={() => setIsGenerationTypeDropdownOpen(!isGenerationTypeDropdownOpen)}
              >
                {generationType === 'text-to-image' ? 'Text to Image' : generationType === 'image-to-image' ? 'Image to Image' : generationType === 'image-to-prompt' ? 'Image to Prompt' : 'Image to Video'}
              </div>
              {isGenerationTypeDropdownOpen && (
                <div className="model-dropdown">
                  <div className="model-option" onClick={() => { setGenerationType('text-to-image'); setIsGenerationTypeDropdownOpen(false); setIsEnhanceMode(false); setIsExpandMode(false); }}>Text to Image</div>
                  <div className="model-option" onClick={() => { setGenerationType('image-to-image'); setIsGenerationTypeDropdownOpen(false); setIsEnhanceMode(false); setIsExpandMode(false); }}>Image to Image</div>
                  <div className="model-option" onClick={() => { setGenerationType('image-to-prompt'); setIsGenerationTypeDropdownOpen(false); setIsEnhanceMode(false); setIsExpandMode(false); }}>Image to Prompt</div>
                  <div className="model-option" onClick={() => { 
                    setGenerationType('image-to-video'); 
                    setSelectedModel('bytedance/seedance-1-lite');
                    setIsGenerationTypeDropdownOpen(false); 
                    setIsEnhanceMode(false); 
                    setIsExpandMode(false);
                  }}>Image to Video</div>
                </div>
              )}
            </div>
          </div>

          {/* Enhance checkbox - only show when Image to Image is selected */}
          {generationType === 'image-to-image' && (
            <div className="toolbar-section" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginRight: '12px' }}>
                <input
                  type="checkbox"
                  checked={isEnhanceMode}
                  onChange={e => setIsEnhanceMode(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Enhance
              </label>
              <label style={{ display: 'flex', alignItems: 'center', marginRight: '12px' }}>
                <input
                  type="checkbox"
                  checked={isExpandMode}
                  onChange={e => setIsExpandMode(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Expand
              </label>
            </div>
          )}

          {(generationType === 'image-to-image' || generationType === 'image-to-video') && (
            <div className="toolbar-section">
              <h3>Source Image</h3>
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
                    <img 
                      src={sourceImagePreview} 
                      alt="Source" 
                      className="image-preview"
                    />
                    <button 
                      onClick={handleRemoveImage}
                      className="remove-image-button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show prompt only when not in enhance mode or expand mode */}
          {generationType !== 'image-to-prompt' && !isEnhanceMode && !isExpandMode && (
            <div className="toolbar-section">
              <h3>Prompt</h3>
              <div className="prompt-input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyDown={handleKeyDown}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  placeholder="Enter your image prompt here..."
                  className="prompt-textarea with-supercharge"
                  rows={4}
                  disabled={generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series'}
                  style={generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' ? { background: '#23242b', color: '#888' } : {}}
                />
                <button
                  className="supercharge-button-inline"
                  style={{ right: '130px' }}
                  onClick={handleAssistant}
                >
                  Assistant
                </button>
                <button
                  onClick={handleSupercharge}
                  className="supercharge-button-inline"
                  disabled={isSuperchargeLoading || !prompt}
                >
                  {isSuperchargeLoading ? <LoadingSpinner size="inline" /> : 'Supercharge'}
                </button>
              </div>
            </div>
          )}

          {/* Video-specific controls */}
          {generationType === 'image-to-video' && (
            <>
              <div className="toolbar-section">
                <label className="toolbar-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={cameraFixed}
                    onChange={(e) => setCameraFixed(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Camera Fixed
                </label>
              </div>
              <div className="toolbar-section">
                <div className="video-info">
                  <div className="video-remaining">
                    Remaining videos today: {videoRemaining}/3
                  </div>
                  {videoPredictionId && (
                    <div className="video-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${videoProgress}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        {videoStepText} {Math.round(videoProgress)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Show model selection only when not in enhance mode, expand mode, and not video generation */}
          {generationType !== 'image-to-prompt' && !isEnhanceMode && !isExpandMode && generationType !== 'image-to-video' && (
            <div className="toolbar-section">
              <label className="toolbar-label">Model</label>
              <div className="model-select-container">
                <div
                  className="model-select-header"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                >
                  {models.find(m => m.value === selectedModel)?.label || 'Select Model'}
                </div>
                {isModelDropdownOpen && (
                  <div className="model-dropdown">
                    {models.map(model => (
                      <div
                        key={model.value}
                        className={`model-option ${model.value === selectedModel ? 'selected' : ''}`}
                        onMouseDown={e => {
                          e.preventDefault();
                          setSelectedModel(model.value);
                          if (model.value === 'flux-kontext-apps/portrait-series') {
                            setSelectedAspectRatio('');
                          } else if (model.value === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe') {
                            setSelectedAspectRatio('1:1');
                          } else {
                            setSelectedAspectRatio(aspectRatios[model.value][0].value);
                          }
                          setIsModelDropdownOpen(false);
                        }}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedModel(model.value);
                            if (model.value === 'flux-kontext-apps/portrait-series') {
                              setSelectedAspectRatio('');
                            } else if (model.value === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe') {
                              setSelectedAspectRatio('1:1');
                            } else {
                              setSelectedAspectRatio(aspectRatios[model.value][0].value);
                            }
                            setIsModelDropdownOpen(false);
                          }
                        }}
                        role="option"
                        aria-selected={model.value === selectedModel}
                      >
                        <div className="model-label">{model.label}</div>
                        {model.description && (
                          <div className="model-description">{model.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show locked model for video generation */}
          {generationType === 'image-to-video' && (
            <div className="toolbar-section">
              <label className="toolbar-label">Model</label>
              <div className="model-select-header" style={{ background: '#23242b', color: '#aaa', cursor: 'not-allowed' }}>
                bytedance
              </div>
            </div>
          )}

          {/* Show enhance-specific controls when in enhance mode */}
          {isEnhanceMode && (
            <>
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
            </>
          )}

          {/* Show expand-specific controls when in expand mode */}
          {isExpandMode && (
            <>
              <div className="toolbar-section">
                <label className="toolbar-label" style={{ display: 'block', textAlign: 'center', width: '100%' }}>Model</label>
                <div className="model-select-header" style={{ background: '#23242b', color: '#aaa', cursor: 'not-allowed' }}>
                  bria
                </div>
              </div>
              <div className="toolbar-section">
                <label className="toolbar-label">Aspect Ratio</label>
                <div className="model-select-container">
                  <div
                    className="model-select-header"
                    onClick={() => setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen)}
                  >
                    {expandAspectRatios.find(r => r.value === selectedAspectRatio)?.label || 'Select Aspect Ratio'}
                  </div>
                  {isAspectRatioDropdownOpen && (
                    <div className="model-dropdown">
                      {expandAspectRatios.map(ratio => (
                        <div
                          key={ratio.value}
                          className={`model-option${selectedAspectRatio === ratio.value ? ' selected' : ''}`}
                          onClick={() => { setSelectedAspectRatio(ratio.value); setIsAspectRatioDropdownOpen(false); }}
                        >
                          {ratio.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {generationType === 'image-to-prompt' && (
            <div className="toolbar-section">
              <h3>Source Image</h3>
              <div className="image-upload-container">
                {!sourceImagePreview ? (
                  <div className="image-upload-box">
                    <input
                      type="file"
                      accept=".webp,.jpg,.jpeg,.png"
                      onChange={handleSourceImageChange}
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
                    <img 
                      src={sourceImagePreview} 
                      alt="Source" 
                      className="image-preview"
                    />
                    <button 
                      onClick={handleRemoveImage}
                      className="remove-image-button"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {generationType === 'image-to-prompt' && (
            <div className="toolbar-section">
              <h3>Prompt Output</h3>
              <div className="prompt-output-container" style={{ fontSize: '11px', minHeight: '150px', height: '150px' }}>
                {generatedPrompt ? (
                  <div className="prompt-text" style={{ fontSize: '12px', position: 'relative' }}>
                    {generatedPrompt}
                    <div className="copy-btn-container">
                      <button onClick={handleCopyPrompt} className={`copy-button small ${isCopied ? 'copied' : ''}`}> 
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '5px'}}>
                          <rect x="7" y="7" width="9" height="9" rx="2" stroke="white" strokeWidth="1.5"/>
                          <rect x="4" y="4" width="9" height="9" rx="2" stroke="white" strokeWidth="1.5"/>
                        </svg>
                        {isCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prompt-placeholder">Generated prompt will appear here</div>
                )}
              </div>
            </div>
          )}

          {/* Show aspect ratio only when not in enhance mode, expand mode, and not video generation */}
          {generationType !== 'image-to-prompt' && !isEnhanceMode && !isExpandMode && generationType !== 'image-to-video' && (
            <div className="toolbar-section">
              <label className="toolbar-label">Aspect Ratio</label>
              <div className="model-select-container">
                <div
                  className="model-select-header"
                  onClick={() => {
                    if (!(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') && 
                        !(selectedModel === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe')) {
                      setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen);
                    }
                  }}
                  style={(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') || 
                         (selectedModel === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe') ? 
                         { background: '#23242b', color: '#888', cursor: 'not-allowed' } : {}}
                >
                  {aspectRatios[selectedModel]?.find(r => r.value === selectedAspectRatio)?.label || 'Select Aspect Ratio'}
                </div>
                {isAspectRatioDropdownOpen && 
                 !(generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series') && 
                 !(selectedModel === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe') && (
                  <div className="model-dropdown">
                    {aspectRatios[selectedModel]?.map(ratio => (
                      <div
                        key={ratio.value}
                        className={`model-option${selectedAspectRatio === ratio.value ? ' selected' : ''}`}
                        onClick={() => { setSelectedAspectRatio(ratio.value); setIsAspectRatioDropdownOpen(false); }}
                      >
                        {ratio.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portrait Series background color dropdown */}
          {generationType === 'image-to-image' && selectedModel === 'flux-kontext-apps/portrait-series' && (
            <div className="toolbar-section">
              <h3>Background Color</h3>
              <div className="model-select-container">
                <div
                  className="model-select-header"
                  ref={backgroundHeaderRef}
                  onClick={openBackgroundDropdown}
                >
                  {portraitBackgroundColors.find(opt => opt.value === portraitBackground)?.label}
                </div>
                {isBackgroundDropdownOpen && ReactDOM.createPortal(
                  <div
                    className="model-dropdown"
                    style={{
                      position: 'absolute',
                      top: backgroundDropdownPos.top,
                      left: backgroundDropdownPos.left,
                      width: backgroundDropdownPos.width,
                      zIndex: 3000
                    }}
                  >
                    {portraitBackgroundColors.map(opt => (
                      <div
                        key={opt.value}
                        className={`model-option${portraitBackground === opt.value ? ' selected' : ''}`}
                        onMouseDown={() => { setPortraitBackground(opt.value); setIsBackgroundDropdownOpen(false); }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
              </div>
            </div>
          )}

          {/* Show style dropdown only for recraft-ai/recraft-v3 in text-to-image */}
          {generationType === 'text-to-image' && selectedModel === 'recraft-ai/recraft-v3' && (
            <div className="toolbar-section">
              <h3>Style</h3>
              <div className="model-select-container">
                <div
                  className="model-select-header"
                  onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                >
                  {recraftStyles.find(opt => opt.value === selectedStyle)?.label || 'Select Style'}
                </div>
                {isStyleDropdownOpen && (
                  <div className="model-dropdown">
                    {recraftStyles.map(opt => (
                      <div
                        key={opt.value}
                        className={`model-option${selectedStyle === opt.value ? ' selected' : ''}`}
                        onMouseDown={() => { setSelectedStyle(opt.value); setIsStyleDropdownOpen(false); }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="toolbar-footer">
          <button
            onClick={handleGenerateWithFlux}
            disabled={
              isGenerateLoading || 
              isVideoGenerationLoading ||
              (generationType === 'image-to-prompt' && !sourceImage) || 
              (isEnhanceMode && !sourceImage) ||
              (generationType === 'image-to-video' && !sourceImage) ||
              (generationType === 'image-to-video' && !prompt.trim()) ||
              (generationType === 'image-to-video' && videoRemaining === 0)
            }
            className="generate-flux-button"
          >
            {isGenerateLoading || isVideoGenerationLoading ? (
              <LoadingSpinner size="inline" />
            ) : isEnhanceMode ? (
              'Enhance'
            ) : isExpandMode ? (
              'Expand'
            ) : generationType === 'image-to-video' ? (
              'Generate Video'
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>
      <div className="main-content">
        {error && <div className="error-message">{error}</div>}
        
        {/* Show before/after slider when in enhance mode and images are loaded */}
        {isEnhanceMode && originalS3 && enhancedS3 && imagesLoaded && (
          <div className="enhance-result-container" style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '20px', color: '#fff' }}>Before / After Comparison</h3>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={originalS3} alt="Original" />}
                itemTwo={<ReactCompareSliderImage src={enhancedS3} alt="Enhanced" />}
                style={{
                  width: '100%',
                  height: '500px',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Show loading spinner when in enhance mode and images are not loaded */}
        {isEnhanceMode && originalS3 && enhancedS3 && !imagesLoaded && (
          <div className="enhance-loading-container" style={{ padding: '20px', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '10px', color: '#fff' }}>Loading comparison...</p>
          </div>
        )}
        
        {/* Show gallery when not in enhance mode or when enhance mode is not active */}
        {(!isEnhanceMode || !originalS3 || !enhancedS3) && (
          <div className="gallery-wrapper">
            <ImageGallery 
              userId={user.id} 
              onUsePrompt={setPrompt} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
      </div>
      {isSuperchargeModalOpen && (
        <div className="supercharge-modal-overlay">
          <div className="supercharge-modal-content">
            <h3>Supercharged Prompt</h3>
            <div className="supercharge-modal-prompt">
              {superchargedPrompt}
            </div>
            <div className="supercharge-modal-actions">
              <button onClick={handleUseSuperchargedPrompt} className="modal-button primary">Use this Prompt</button>
              <button onClick={handleCloseSuperchargeModal} className="modal-button secondary">Close</button>
            </div>
          </div>
        </div>
      )}
      {isAssistantModalOpen && (
        <div className="assistant-modal-overlay">
          <div className="assistant-modal-content">
            <div className="assistant-modal-header">
              <h3>Assistant Prompt Builder</h3>
              <button 
                className="assistant-modal-close"
                onClick={handleCloseAssistantModal}
              >
                ×
              </button>
            </div>
            
            <div className="assistant-modal-body">
              <div className="assistant-categories">
                {Object.entries(assistantCategories).map(([key, category]) => (
                  <div key={key} className="assistant-category-section">
                    <div 
                      className="assistant-category-header"
                      onClick={() => toggleAssistantSection(key)}
                    >
                      <h4>{category.title}</h4>
                      <span className="assistant-expand-icon">
                        {assistantCollapsedSections[key] ? '+' : '−'}
                      </span>
                    </div>
                    
                    {!assistantCollapsedSections[key] && (
                      <div className="assistant-category-content">
                        {key === 'subject' ? (
                          <div className="assistant-style-selector">
                            <select
                              value={assistantSelectedOptions.subject.main}
                              onChange={(e) => handleAssistantOptionChange('subject', 'main', e.target.value)}
                            >
                              <option value="">Select Subject Matter</option>
                              {category.main.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                            {assistantSelectedOptions.subject.main && (
                              <select
                                value={assistantSelectedOptions.subject.sub}
                                onChange={(e) => handleAssistantOptionChange('subject', 'sub', e.target.value)}
                              >
                                <option value="">Select Specific Subject</option>
                                {category.sub[assistantSelectedOptions.subject.main].map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ) : key === 'resolution' ? (
                          <div className="assistant-style-selector">
                            <select
                              value={assistantSelectedOptions.resolution}
                              onChange={(e) => {
                                handleResolutionChange(e.target.value);
                              }}
                            >
                              <option value="">Select Resolution</option>
                              {category.options.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="assistant-style-selector">
                            <select
                              value={assistantSelectedOptions[key].main}
                              onChange={(e) => {
                                const selectedMain = e.target.value;
                                handleAssistantOptionChange(key, 'main', selectedMain);
                                handleAssistantOptionChange(key, 'sub', '');
                              }}
                            >
                              <option value="">Select {category.title}</option>
                              {category.options.map(option => (
                                <option key={option.main} value={option.main}>
                                  {option.main}
                                </option>
                              ))}
                            </select>
                            
                            {assistantSelectedOptions[key].main && (
                              <select
                                value={assistantSelectedOptions[key].sub}
                                onChange={(e) => {
                                  handleAssistantOptionChange(key, 'sub', e.target.value);
                                }}
                                className="assistant-subcategory-select"
                              >
                                <option value="">Select {assistantSelectedOptions[key].main}</option>
                                {category.options
                                  .find(option => option.main === assistantSelectedOptions[key].main)
                                  ?.subcategories.map(sub => (
                                    <option key={sub} value={sub}>
                                      {sub}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="assistant-prompt-output">
                <h4>Generated Prompt</h4>
                <textarea
                  value={assistantGeneratedPrompt}
                  onChange={(e) => setAssistantGeneratedPrompt(e.target.value)}
                  placeholder="Your prompt will appear here as you make selections..."
                  className="assistant-prompt-textarea"
                  rows={6}
                />
              </div>
            </div>
            
            <div className="assistant-modal-actions">
              <button onClick={handleUseAssistantPrompt} className="modal-button primary">Use this Prompt</button>
              <button onClick={handleCloseAssistantModal} className="modal-button secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 