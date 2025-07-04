import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import Auth from './components/auth/Auth';
import ResetPassword from './components/auth/ResetPassword';
import ForgotPassword from './components/auth/ForgotPassword';
import Admin from './components/admin/Admin';
import TweetOptimizer from './components/TweetOptimizer';
import ReverseEngineer from './components/ReverseEngineer';
import PowerWords from './components/PowerWords';
import PromptAssistant from './components/PromptAssistant';
import ImageToPrompt from './components/ImageToPrompt';
import ImageGenerator from './components/ImageGenerator';
import EvergreenContent from './components/EvergreenContent';
import Home from './components/Home';
import LoadingSpinner from './components/LoadingSpinner';
import NavBar from './components/NavBar';
import WritingToolsPage from './components/WritingToolsPage';
import EnhanceImage from './components/EnhanceImage';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function AppContent() {
  const { token, user, logout, isAuthLoading, authError, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [tweet, setTweet] = useState('');
  const [savedTweets, setSavedTweets] = useState([]);
  const [selectedTones, setSelectedTones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHook, setSelectedHook] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [reverseText, setReverseText] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [powerText, setPowerText] = useState('');
  const [powerResults, setPowerResults] = useState([]);
  const [currentFeature, setCurrentFeature] = useState(null);

  const tones = [
    // Professional & Business
    { id: 'professional', label: 'Professional' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'sales', label: 'Sales' },
    { id: 'persuasive', label: 'Persuasive' },
    
    // Casual & Personal
    { id: 'casual', label: 'Casual' },
    { id: 'conversational', label: 'Conversational' },
    { id: 'authentic', label: 'Authentic' },
    { id: 'heartfelt', label: 'Heartfelt' },
    
    // Entertainment & Humor
    { id: 'humorous', label: 'Humorous' },
    { id: 'witty', label: 'Witty' },
    { id: 'playful', label: 'Playful' },
    { id: 'sarcastic', label: 'Sarcastic' },
    
    // Educational & Informative
    { id: 'educational', label: 'Educational' },
    { id: 'informative', label: 'Informative' },
    { id: 'analytical', label: 'Analytical' },
    { id: 'technical', label: 'Technical' },
    
    // Inspirational & Motivational
    { id: 'inspirational', label: 'Inspirational' },
    { id: 'motivational', label: 'Motivational' },
    { id: 'empowering', label: 'Empowering' },
    { id: 'encouraging', label: 'Encouraging' }
  ];

  const toneColors = {
    // Professional & Business
    professional: '#0077B5',  // LinkedIn blue
    corporate: '#1F3A60',     // Dark business blue
    sales: '#2E8B57',        // Sea green
    persuasive: '#8B0000',   // Dark red

    // Casual & Personal
    casual: '#FF9933',       // Warm orange
    conversational: '#FFA07A', // Light salmon
    authentic: '#20B2AA',    // Light sea green
    heartfelt: '#FF69B4',    // Hot pink

    // Entertainment & Humor
    humorous: '#FF4D4D',     // Bright red
    witty: '#FF6B6B',       // Coral red
    playful: '#FFB6C1',     // Light pink
    sarcastic: '#BA55D3',   // Medium orchid

    // Educational & Informative
    educational: '#33CC33',  // Green
    informative: '#4169E1',  // Royal blue
    analytical: '#483D8B',   // Dark slate blue
    technical: '#4682B4',    // Steel blue

    // Inspirational & Motivational
    inspirational: '#9933FF', // Bright purple
    motivational: '#FF1493',  // Deep pink
    empowering: '#DA70D6',   // Orchid
    encouraging: '#DDA0DD'    // Plum
  };

  const hookOptions = [
    { id: 'none', label: 'No Hook' },
    { id: 'curiosity', label: 'Curiosity' },
    { id: 'controversial', label: 'Controversial' },
    { id: 'number', label: 'Number/List' },
    { id: 'shock', label: 'Shock' },
    { id: 'relatable', label: 'Relatable' }
  ];

  const handleSubmit = async () => {
    if (tweet.trim()) {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/rewrite-tweet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            tweet, 
            tones: selectedTones,
            hook: selectedHook 
          }),
        });

        const data = await response.json();
        
        setSavedTweets([
          {
            original: tweet,
            optimized: data.rewrittenTweets || [],
            tones: selectedTones,
            hook: selectedHook
          },
          ...savedTweets
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReverseAnalysis = async () => {
    if (reverseText.trim()) {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/analyze-tweet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ tweet: reverseText }),
        });

        const data = await response.json();
        
        // Convert the analysis string into the expected format
        const analysisArray = data.analysis ? [
          { label: 'Analysis', value: data.analysis }
        ] : [];

        setAnalysisResults(analysisArray);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePowerAnalysis = async () => {
    if (powerText.trim()) {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/analyze-power-words`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ text: powerText }),
        });

        const data = await response.json();
        setPowerResults(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('Current feature changed to:', currentFeature);
  }, [currentFeature]);

  // Reset scroll position when changing tabs
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleFeatureSelect = (featureId) => {
    setActiveTab(featureId);
    setCurrentFeature(featureId);
  };

  const renderFeature = () => {
    switch(currentFeature) {
      case 'auth':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <Auth onClose={() => setCurrentFeature(null)} />
          </>
        );
      case 'optimize':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <TweetOptimizer 
              tweet={tweet}
              setTweet={setTweet}
              selectedTones={selectedTones}
              setSelectedTones={setSelectedTones}
              selectedHook={selectedHook}
              setSelectedHook={setSelectedHook}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              savedTweets={savedTweets}
              tones={tones}
              hookOptions={hookOptions}
              toneColors={toneColors}
            />
          </>
        );
      case 'evergreen':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <EvergreenContent />
          </>
        );
      case 'imageToPrompt':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <ImageToPrompt />
          </>
        );
      case 'reverse':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <ReverseEngineer 
              reverseText={reverseText}
              setReverseText={setReverseText}
              handleReverseAnalysis={handleReverseAnalysis}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              analysisResults={analysisResults}
              setAnalysisResults={setAnalysisResults}
            />
          </>
        );
      case 'power':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <PowerWords 
              powerText={powerText}
              setPowerText={setPowerText}
              isLoading={isLoading}
              powerResults={powerResults}
              setPowerResults={setPowerResults}
              handlePowerAnalysis={handlePowerAnalysis}
            />
          </>
        );
      case 'prompt':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Home
            </button>
            <PromptAssistant />
          </>
        );
      case 'imageGenerator':
        return (
          <>
            <ImageGenerator />
          </>
        );
      default:
        return <Home 
          onSelectFeature={setCurrentFeature} 
          isLoggedIn={!!user && !!token} 
        />;
    }
  };

  useEffect(() => {
    const checkApi = async () => {
      try {
        // Log device/browser info
        console.log('Client Info:', {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          language: navigator.language,
          connection: navigator.connection?.effectiveType || 'unknown'
        });

        console.log('Attempting to connect to:', process.env.REACT_APP_API_URL);
        console.log('Browser location:', window.location.href);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/test-db`, {
          // Add explicit headers for iOS
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          // Add credentials mode for iOS Safari
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Connection successful:', data);
      } catch (error) {
        console.error('API Error:', error);
        setApiError(`Failed to connect to API: ${error.message}. Please try again or contact support.`);
      }
    };
    checkApi();
  }, []);

  useEffect(() => {
    console.log('Auth state:', { user, isAdmin });
  }, [user, isAdmin]);

  const handleLogout = () => {
    logout();
    setCurrentFeature(null); // Return to home page
  };

  // Sync currentFeature with route
  useEffect(() => {
    if (location.pathname === '/image-generator') {
      if (!user || !token) {
        // Not authenticated, redirect to login
        setCurrentFeature(null);
        setShowAuth(true);
        navigate('/');
      } else {
        setCurrentFeature('imageGenerator');
      }
    } else if (location.pathname === '/writing-tools') {
      if (!user || !token) {
        // Not authenticated, redirect to login
        setCurrentFeature(null);
        setShowAuth(true);
        navigate('/');
      } else {
        setCurrentFeature(null); // Home with written tools tab
        setActiveTab('written');
      }
    } else if (location.pathname === '/') {
      setCurrentFeature(null); // Always reset to home
      const params = new URLSearchParams(location.search);
      if (params.get('tab') === 'written') {
        setActiveTab('written');
      } else {
        setActiveTab('home');
      }
    }
  }, [location, user, token, navigate]);

  return (
    <>
      <NavBar />
      <div className="App">
        {apiError && (
          <div className="api-error-banner">
            API Error: {apiError}
          </div>
        )}
        {authError && (
          <div className="auth-error-banner">
            {authError}
          </div>
        )}
        {isAuthLoading ? (
          <div className="auth-loading">
            <LoadingSpinner />
            <p>Loading...</p>
          </div>
        ) : (
          <div className="app-content">
            {showAuth ? (
              <Auth onClose={() => setShowAuth(false)} />
            ) : user?.is_admin ? (
              <div className="admin-container">
                <button className="logout-button" onClick={handleLogout}>Logout</button>
                <Admin />
              </div>
            ) : (
              <>
                {renderFeature()}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/writing-tools" element={<WritingToolsPage />} />
          <Route path="/image-enhance" element={<EnhanceImage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;