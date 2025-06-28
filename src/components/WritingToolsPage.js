import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import Home from './Home';
import NavBar from './NavBar';
import TweetOptimizer from './TweetOptimizer';
import ReverseEngineer from './ReverseEngineer';
import PowerWords from './PowerWords';
import EvergreenContent from './EvergreenContent';
import './NavBar.css';

export default function WritingToolsPage() {
  const { user, token } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(!user || !token);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [tweet, setTweet] = useState('');
  const [savedTweets, setSavedTweets] = useState([]);
  const [selectedTones, setSelectedTones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHook, setSelectedHook] = useState('');
  const [reverseText, setReverseText] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [powerText, setPowerText] = useState('');
  const [powerResults, setPowerResults] = useState([]);

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'corporate', label: 'Corporate' },
    { id: 'sales', label: 'Sales' },
    { id: 'persuasive', label: 'Persuasive' },
    { id: 'casual', label: 'Casual' },
    { id: 'conversational', label: 'Conversational' },
    { id: 'authentic', label: 'Authentic' },
    { id: 'heartfelt', label: 'Heartfelt' },
    { id: 'humorous', label: 'Humorous' },
    { id: 'witty', label: 'Witty' },
    { id: 'playful', label: 'Playful' },
    { id: 'sarcastic', label: 'Sarcastic' },
    { id: 'educational', label: 'Educational' },
    { id: 'informative', label: 'Informative' },
    { id: 'analytical', label: 'Analytical' },
    { id: 'technical', label: 'Technical' },
    { id: 'inspirational', label: 'Inspirational' },
    { id: 'motivational', label: 'Motivational' },
    { id: 'empowering', label: 'Empowering' },
    { id: 'encouraging', label: 'Encouraging' }
  ];

  const toneColors = {
    professional: '#0077B5',
    corporate: '#1F3A60',
    sales: '#2E8B57',
    persuasive: '#8B0000',
    casual: '#FF9933',
    conversational: '#FFA07A',
    authentic: '#20B2AA',
    heartfelt: '#FF69B4',
    humorous: '#FF4D4D',
    witty: '#FF6B6B',
    playful: '#FFB6C1',
    sarcastic: '#BA55D3',
    educational: '#33CC33',
    informative: '#4169E1',
    analytical: '#483D8B',
    technical: '#4682B4',
    inspirational: '#9933FF',
    motivational: '#FF1493',
    empowering: '#DA70D6',
    encouraging: '#DDA0DD'
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/rewrite-tweet`, {
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/analyze-tweet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ tweet: reverseText }),
        });

        const data = await response.json();
        
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
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/analyze-power-words`, {
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

  const handleFeatureSelect = (featureId) => {
    setCurrentFeature(featureId);
  };

  if (!user || !token) {
    return (
      <>
        <NavBar />
        <div className="navbar-modal-overlay">
          <div className="navbar-modal">
            <div className="navbar-modal-header">
              <span className="navbar-modal-title">Login Required</span>
              <button className="navbar-modal-close" onClick={() => setShowLoginModal(false)}>&times;</button>
            </div>
            <div className="navbar-modal-body">
              <p>You must be logged in to access this area. Please log in or register to continue.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const renderFeature = () => {
    switch(currentFeature) {
      case 'optimize':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Writing Tools
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
      case 'reverse':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Writing Tools
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
              ← Back to Writing Tools
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
      case 'evergreen':
        return (
          <>
            <button 
              className="back-home-button"
              onClick={() => setCurrentFeature(null)}
            >
              ← Back to Writing Tools
            </button>
            <EvergreenContent />
          </>
        );
      default:
        return <Home isLoggedIn={true} onSelectFeature={handleFeatureSelect} initialTab="written" />;
    }
  };

  return (
    <>
      <NavBar />
      {renderFeature()}
    </>
  );
} 