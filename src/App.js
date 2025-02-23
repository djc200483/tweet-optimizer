import { useState } from 'react';
import TweetOptimizer from './components/TweetOptimizer';
import ReverseEngineer from './components/ReverseEngineer';
import PowerWords from './components/PowerWords';
import Home from './components/Home';
import './App.css';

function App() {
  const [tweet, setTweet] = useState('');
  const [savedTweets, setSavedTweets] = useState([]);
  const [selectedTone, setSelectedTone] = useState('professional'); // Default tone
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHook, setSelectedHook] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [reverseText, setReverseText] = useState('');
  const [analysisResults, setAnalysisResults] = useState([]);
  const [powerText, setPowerText] = useState('');
  const [powerResults, setPowerResults] = useState([]);

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
        const response = await fetch('http://localhost:3001/rewrite-tweet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tweet, 
            tone: selectedTone,
            hook: selectedHook 
          }),
        });

        const data = await response.json();
        
        setSavedTweets([
          {
            original: tweet,
            optimized: data.rewrittenTweets || [],
            tone: selectedTone,
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = (indexToDelete) => {
    setSavedTweets(savedTweets.filter((_, index) => index !== indexToDelete));
  };

  const handleReverseAnalysis = async () => {
    if (reverseText.trim()) {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3001/analyze-tweet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tweet: reverseText }),
        });

        const data = await response.json();
        setAnalysisResults(data.analysis);
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
        const response = await fetch('http://localhost:3001/analyze-power-words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

  return (
    <div className="App">
      <h1>EchoSphere</h1>
      
      <div className="tab-navigation">
        {activeTab !== 'home' && (
          <>
            <button 
              className={`tab-button ${activeTab === 'optimize' ? 'active' : ''}`}
              onClick={() => setActiveTab('optimize')}
            >
              Tweet Optimizer
            </button>
            <button 
              className={`tab-button ${activeTab === 'reverse' ? 'active' : ''}`}
              onClick={() => setActiveTab('reverse')}
            >
              Reverse Engineer
            </button>
            <button 
              className={`tab-button ${activeTab === 'power' ? 'active' : ''}`}
              onClick={() => setActiveTab('power')}
            >
              Power Words
            </button>
          </>
        )}
      </div>

      {activeTab === 'home' ? (
        <Home onSelectFeature={setActiveTab} />
      ) : activeTab === 'optimize' ? (
        <TweetOptimizer 
          tweet={tweet}
          setTweet={setTweet}
          selectedTone={selectedTone}
          setSelectedTone={setSelectedTone}
          selectedHook={selectedHook}
          setSelectedHook={setSelectedHook}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          savedTweets={savedTweets}
          handleDelete={handleDelete}
          handleCopy={handleCopy}
          tones={tones}
          hookOptions={hookOptions}
          toneColors={toneColors}
        />
      ) : activeTab === 'reverse' ? (
        <ReverseEngineer 
          reverseText={reverseText}
          setReverseText={setReverseText}
          handleReverseAnalysis={handleReverseAnalysis}
          isLoading={isLoading}
          analysisResults={analysisResults}
        />
      ) : (
        <PowerWords 
          powerText={powerText}
          setPowerText={setPowerText}
          isLoading={isLoading}
          powerResults={powerResults}
          setPowerResults={setPowerResults}
          handlePowerAnalysis={handlePowerAnalysis}
        />
      )}
    </div>
  );
}

export default App;