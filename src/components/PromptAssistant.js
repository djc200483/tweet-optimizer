import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function PromptAssistant() {
  const [selectedOptions, setSelectedOptions] = useState({
    subject: '',
    resolution: '',
    style: {
      main: '',
      sub: ''
    },
    emotion: {
      main: '',
      sub: ''
    },
    lighting: {
      main: '',
      sub: ''
    },
    composition: '',
    timePeriod: '',
    extraDetails: ''
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [superchargedPrompt, setSuperchargedPrompt] = useState('');
  const [isSuperchargeLoading, setIsSuperchargeLoading] = useState(false);
  const [isGenerateLoading, setIsGenerateLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSuperchargedCopied, setIsSuperchargedCopied] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showImageGrid, setShowImageGrid] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [superchargedAspectRatio, setSuperchargedAspectRatio] = useState('1:1');

  // Add useEffect to update prompt whenever selectedOptions changes
  useEffect(() => {
    const newPrompt = generatePrompt();
    setGeneratedPrompt(newPrompt);
  }, [selectedOptions]);

  const categories = {
    subject: {
      title: 'Subject Matter',
      options: ['Person/Character', 'Object', 'Scene', 'Landscape', 'Animal', 'Abstract Concept', 
                'Historical Event', 'Futuristic Theme', 'Sci-Fi Theme', 'Mythological Theme', 
                'Fantasy Theme', 'Pop Culture Inspired', 'Artistic Interpretation of a Phrase']
    },
    resolution: {
      title: 'Resolution',
      options: [
        'Low Resolution (480p)',
        'Standard HD (720p)',
        'Full HD (1080p)',
        '2K Resolution',
        '4K Ultra HD',
        '8K Ultra HD'
      ]
    },
    style: {
      title: 'Style & Medium',
      options: [
        {
          main: 'Photorealistic',
          subcategories: [
            'Hyperrealism',
            'Realistic Portraits',
            'Nature Realism',
            'Urban Realism',
            'Macro Photography Style'
          ]
        },
        {
          main: 'Digital Painting',
          subcategories: [
            'Matte Painting',
            'Concept Art',
            'Fantasy Digital Landscapes',
            'Character Design',
            'Abstract Digital Art'
          ]
        },
        {
          main: 'Sketch',
          subcategories: [
            'Pencil Sketch',
            'Charcoal Style',
            'Rough Line Work',
            'Inked Illustrations',
            'Minimalist Sketches'
          ]
        },
        {
          main: 'Line Art',
          subcategories: [
            'Clean Contour Lines',
            'Abstract Geometric Shapes',
            'Intricate Mandalas',
            'Cartoon Outlines',
            'Architectural Drafts'
          ]
        },
        {
          main: 'Watercolor',
          subcategories: [
            'Abstract Watercolor Blends',
            'Soft Pastel Landscapes',
            'Splatter Effects',
            'Gradient Washes',
            'Detailed Botanical Art'
          ]
        },
        {
          main: 'Oil Painting',
          subcategories: [
            'Renaissance-Style Portraits',
            'Baroque Techniques',
            'Impasto Textures',
            'Still Life Scenes',
            'Dramatic Landscapes'
          ]
        },
        {
          main: '3D Rendered',
          subcategories: [
            'Cinematic 3D Scenes',
            'Game-Ready Assets',
            'Realistic 3D Models',
            'Sci-Fi Worlds',
            'Architectural Visualizations'
          ]
        },
        {
          main: 'Cyberpunk',
          subcategories: [
            'Neon Streets',
            'High-Tech Dystopia',
            'Cybernetic Enhancements',
            'Futuristic Urban Landscapes',
            'Virtual Reality Worlds'
          ]
        },
        {
          main: 'Futuristic',
          subcategories: [
            'Space Exploration',
            'Advanced Robotics',
            'Megacities of the Future',
            'Sci-Fi Vehicles',
            'Futuristic Wearable Tech'
          ]
        },
        {
          main: 'Vintage',
          subcategories: [
            '1920s Art Deco',
            'Victorian-Era Style',
            'Mid-Century Modern',
            'Rustic Charm',
            'Classic Advertisements'
          ]
        },
        {
          main: 'Retro',
          subcategories: [
            '1980s Neon Vibes',
            '70s Psychedelic Colors',
            'Vintage Gaming Style',
            'Old-School Pop Art',
            'Retro Futurism'
          ]
        },
        {
          main: 'Surreal',
          subcategories: [
            'Dreamlike Landscapes',
            'Floating Objects',
            'Melting Forms',
            'Abstract Surrealism',
            'Impossible Perspectives'
          ]
        },
        {
          main: 'Dreamlike',
          subcategories: [
            'Soft, Ethereal Colors',
            'Magical Night Skies',
            'Fantasy Creatures',
            'Glowing Forests',
            'Gentle, Wavy Motions'
          ]
        },
        {
          main: 'Noir',
          subcategories: [
            'High-Contrast Shadows',
            'Foggy Streets',
            'Vintage Detective Scenes',
            'Monochrome Mystery',
            'Smoky Nightclubs'
          ]
        },
        {
          main: 'Dark Aesthetic',
          subcategories: [
            'Gothic Architecture',
            'Shadowy Figures',
            'Eerie Atmospheres',
            'Mythical Creatures in Darkness',
            'Mist and Fog'
          ]
        },
        {
          main: 'Pixel Art',
          subcategories: [
            'Retro Gaming Characters',
            'Isometric Pixel Cities',
            'Pixelated Landscapes',
            '8-Bit Animals',
            'Nostalgic Game Worlds'
          ]
        },
        {
          main: '8-bit',
          subcategories: [
            'Blocky Pixel Graphics',
            'Simplistic Character Sprites',
            'Classic Arcade Game Scenes',
            'Bright Pixel Animations',
            'Minimalist Retro Style'
          ]
        },
        {
          main: 'Ukiyo-e',
          subcategories: [
            'Nature Landscapes',
            'Kabuki Performers',
            'Mythological Scenes',
            'Everyday Edo Life',
            'Woodblock Printing Texture'
          ]
        },
        {
          main: 'Traditional Asian Art',
          subcategories: [
            'Brush Ink Calligraphy',
            'Paper Folding Techniques',
            'Lotus and Bamboo Motifs',
            'Vibrant Cultural Patterns',
            'Dragon and Phoenix Imagery'
          ]
        },
        {
          main: 'Impressionist',
          subcategories: [
            'Light and Color Play',
            'Nature-Inspired Scenes',
            'Loose, Visible Brushstrokes',
            'Cityscapes in Motion',
            'Focus on Light and Atmosphere'
          ]
        },
        {
          main: 'Classical Painting',
          subcategories: [
            'Renaissance Masterpieces',
            'Baroque Dramatic Themes',
            'Greek Mythology Depictions',
            'Historical Portraiture',
            'Lavish Still Life Compositions'
          ]
        }
      ]
    },
    emotion: {
      title: 'Emotion & Mood',
      options: [
        {
          main: 'Happy',
          subcategories: [
            'Joyful Celebration',
            'Laughter and Smiles',
            'Radiant Sunshine',
            'Festive Atmosphere',
            'Playful Interaction'
          ]
        },
        {
          main: 'Joyful',
          subcategories: [
            'Bursting with Energy',
            'Pure Bliss',
            'Ecstatic Moments',
            'Carefree Vibes',
            'Warm Embrace'
          ]
        },
        {
          main: 'Mysterious',
          subcategories: [
            'Foggy Pathways',
            'Hidden Figures',
            'Cryptic Symbols',
            'Shadowy Corners',
            'Eerie Silence'
          ]
        },
        {
          main: 'Intriguing',
          subcategories: [
            'Puzzling Expressions',
            'Unexpected Twists',
            'Enigmatic Artifacts',
            'Clues in Plain Sight',
            'Layers of Meaning'
          ]
        },
        {
          main: 'Dark',
          subcategories: [
            'Sinister Shadows',
            'Ominous Clouds',
            'Foreboding Atmosphere',
            'Silent Danger',
            'Brooding Figures'
          ]
        },
        {
          main: 'Ominous',
          subcategories: [
            'Approaching Storm',
            'Creeping Threat',
            'Tension in the Air',
            'Haunting Landscapes',
            'Eyes Watching from Afar'
          ]
        },
        {
          main: 'Epic',
          subcategories: [
            'Heroic Adventures',
            'Monumental Achievements',
            'Vast Open Worlds',
            'Intense Battle Scenes',
            'Towering Mountains'
          ]
        },
        {
          main: 'Grand',
          subcategories: [
            'Majestic Palaces',
            'Sweeping Landscapes',
            'Glorious Sunsets',
            'Regal Portraits',
            'Awe-Inspiring Scale'
          ]
        },
        {
          main: 'Melancholic',
          subcategories: [
            'Tear-Streaked Faces',
            'Lonely Streets',
            'Faded Memories',
            'Quiet Reflection',
            'Soft Rainfall'
          ]
        },
        {
          main: 'Sad',
          subcategories: [
            'Weeping Willows',
            'Broken Hearts',
            'Empty Chairs',
            'Heavy Gray Skies',
            'Silent Farewells'
          ]
        },
        {
          main: 'Inspirational',
          subcategories: [
            'Rising Above Challenges',
            'Triumph Against Odds',
            'Motivational Gestures',
            'Rays of Hope',
            'Victory March'
          ]
        },
        {
          main: 'Uplifting',
          subcategories: [
            'Positive Energy',
            'Bright Smiles',
            'Overcoming Adversity',
            'Encouraging Words',
            'Warm Connections'
          ]
        },
        {
          main: 'Peaceful',
          subcategories: [
            'Calm Waters',
            'Gentle Breezes',
            'Meditative Serenity',
            'Quiet Forests',
            'Starlit Skies'
          ]
        },
        {
          main: 'Serene',
          subcategories: [
            'Tranquil Lakes',
            'Blossoming Gardens',
            'Soft Glow of Lanterns',
            'Harmonious Balance',
            'Restful Sleep'
          ]
        },
        {
          main: 'Eerie',
          subcategories: [
            'Whispers in the Dark',
            'Shadows Moving',
            'Ghostly Figures',
            'Abandoned Buildings',
            'Chilling Wind'
          ]
        },
        {
          main: 'Uncanny',
          subcategories: [
            'Slightly Off-Balance Scenes',
            'Familiar but Strange',
            'Doppelgangers',
            'Twisted Realities',
            'Objects Out of Place'
          ]
        },
        {
          main: 'Action-Packed',
          subcategories: [
            'Intense Movement',
            'Explosive Energy',
            'High-Stakes Drama',
            'Dynamic Poses',
            'Thrilling Chase Scenes'
          ]
        },
        {
          main: 'Intense',
          subcategories: [
            'Grit and Determination',
            'High-Energy Moments',
            'Fierce Expressions',
            'Clashing Forces',
            'Suspenseful Tension'
          ]
        },
        {
          main: 'Calm',
          subcategories: [
            'Relaxing Beaches',
            'Quiet Sunsets',
            'Slow Breathing Moments',
            'Gentle Ripples',
            'Cloud Watching'
          ]
        },
        {
          main: 'Nostalgic',
          subcategories: [
            'Childhood Memories',
            'Vintage Objects',
            'Old Photographs',
            'Familiar Scents',
            'Long-Lost Places'
          ]
        }
      ]
    },
    lighting: {
      title: 'Lighting & Atmosphere',
      options: [
        {
          main: 'Warm Lighting',
          subcategories: [
            'Golden Hour Glow',
            'Soft Morning Light',
            'Warm Indoor Lamp',
            'Candlelit Ambiance',
            'Sunset Hues'
          ]
        },
        {
          main: 'Cold Lighting',
          subcategories: [
            'Cool Moonlight',
            'Icy Blue Glimmer',
            'Overcast Day',
            'Frosty Twilight',
            'LED Fluorescent Glow'
          ]
        },
        {
          main: 'Moody Lighting',
          subcategories: [
            'Low-Key Shadows',
            'Subtle Highlights',
            'Dimly Lit Spaces',
            'Cozy Fireplace Glow',
            'Gentle Ambient Light'
          ]
        },
        {
          main: 'High Contrast',
          subcategories: [
            'Chiaroscuro Effect',
            'Bold Shadow Play',
            'Stark Opposites',
            'Silhouetted Figures',
            'Dramatic Edge Lighting'
          ]
        },
        {
          main: 'Dramatic Lighting',
          subcategories: [
            'Sharp Spotlights',
            'Ray Burst Effects',
            'Focused Illumination',
            'Bold Shadows',
            'Cinematic Key Lights'
          ]
        },
        {
          main: 'Ethereal Glow',
          subcategories: [
            'Angelic Light Beams',
            'Mystic Auras',
            'Magical Backdrops',
            'Diffused Soft Glow',
            'Heavenly Radiance'
          ]
        },
        {
          main: 'Foggy and Hazy',
          subcategories: [
            'Misty Morning Scenes',
            'Smoky Battlefield',
            'Heavy Fog Shrouding Objects',
            'Rainy Atmospheres',
            'Low Visibility'
          ]
        },
        {
          main: 'Cyberpunk Neon',
          subcategories: [
            'Neon Signs Reflections',
            'Vibrant Street Colors',
            'Electric Blue and Pink Hues',
            'Urban Nightlife Glow',
            'Rain-Slicked Streets with Neon Lights'
          ]
        },
        {
          main: 'Vintage Film Grain',
          subcategories: [
            'Faded Sepia Filters',
            'Dust and Scratches Effect',
            'Washed-Out Colors',
            'Retro Movie Frame',
            '20th Century Film Look'
          ]
        },
        {
          main: 'Surreal and Dreamlike',
          subcategories: [
            'Floating Particles',
            'Glowing Clouds',
            'Unnatural Colors',
            'Twilight Magic',
            'Soft Blurred Edges'
          ]
        },
        {
          main: 'Harsh Shadows',
          subcategories: [
            'Strong Overhead Light',
            'Sharp Black Silhouettes',
            'Clear Divisions Between Light and Dark',
            'Intense Sunlight Angles',
            'Streetlight Isolation'
          ]
        },
        {
          main: 'Noir Style',
          subcategories: [
            'Black-and-White Tones',
            'Dimly Lit Streets',
            'Flickering Lights',
            'Rainy Nights',
            'Mystery Fog'
          ]
        },
        {
          main: 'Soft Glow',
          subcategories: [
            'Gentle Candlelight',
            'Moonlit Nights',
            'Sunset Reflection',
            'Early Morning Light',
            'Subtle Night Glow'
          ]
        },
        {
          main: 'Natural Light',
          subcategories: [
            'Sunbeams Through Trees',
            'Open Sky Illumination',
            'Clear Daylight',
            'Forest Canopies',
            'Ocean Horizon Light'
          ]
        },
        {
          main: 'Stormy Atmosphere',
          subcategories: [
            'Lightning Flashes',
            'Dark, Rolling Clouds',
            'Rainy Skylines',
            'Thunderstorm Backdrops',
            'Heavy Overcast Gloom'
          ]
        },
        {
          main: 'Magical Effects',
          subcategories: [
            'Sparkling Particles',
            'Glowing Magical Circles',
            'Shimmering Energy Fields',
            'Luminescent Glows',
            'Aura-like Lighting'
          ]
        },
        {
          main: 'Urban Nightlife',
          subcategories: [
            'City Skylines at Night',
            'Traffic Light Reflections',
            'Bustling Streets with Lanterns',
            'Vibrant Rooftop Views',
            'Lit Windows of Skyscrapers'
          ]
        },
        {
          main: 'Fire and Heat',
          subcategories: [
            'Blazing Flames',
            'Campfire Sparks',
            'Smoky Orange Hues',
            'Smoldering Glow',
            'Intense Heat Waves'
          ]
        },
        {
          main: 'Snowy and Wintery',
          subcategories: [
            'Crisp White Illumination',
            'Reflections on Ice',
            'Frost-Covered Windows',
            'Pale Blue Hues',
            'Falling Snow Lit by Lamps'
          ]
        },
        {
          main: 'Underwater Glow',
          subcategories: [
            'Shimmering Aquatic Ripples',
            'Submarine Light Shafts',
            'Bioluminescent Glow',
            'Ocean Depth Shadows',
            'Ethereal Blue-Green Light'
          ]
        }
      ]
    },
    composition: {
      title: 'Composition & Perspective',
      options: ['Close-up', 'Macro Shot', 'Wide-angle View', 'Landscape View', 
                'First-person Perspective', 'Over-the-shoulder View', 'Dramatic Low Angle', 
                'Bird\'s-eye View', 'Symmetrical Composition', 'Chaotic Composition', 
                'Abstract Composition']
    },
    timePeriod: {
      title: 'Time Period & Setting',
      options: ['Ancient History', 'Roman Empire', 'Medieval', 'Renaissance', 'Futuristic', 
                'Sci-Fi', 'Modern-Day', 'Present', 'Alternative History', 'Steampunk 1800s', 
                'Fantasy World', 'Mythological Setting', 'Post-Apocalyptic', 'Ruined World']
    },
    extraDetails: {
      title: 'Extra Details & Enhancements',
      options: ['Hyper-detailed Textures', 'Ethereal Effects', 'Magical Effects', 
                'Realistic Weather Elements', 'Rain', 'Snow', 'Mist', 'Motion Blur', 
                'Action Streaks', 'Fire', 'Smoke', 'Explosions', 'Light Rays', 'God Rays']
    }
  };

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' }
  ];

  const handleStyleChange = (mainStyle, subStyle = '') => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      style: {
        main: mainStyle,
        sub: subStyle
      }
    }));
  };

  const handleOptionChange = (category, value) => {
    if (category === 'style') return; // Style is handled by handleStyleChange
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      [category]: value
    }));
  };

  const generatePrompt = () => {
    const parts = [];
    
    if (selectedOptions.subject) parts.push(selectedOptions.subject);
    if (selectedOptions.resolution) parts.push(`in ${selectedOptions.resolution}`);
    if (selectedOptions.style.main) {
      const styleText = selectedOptions.style.sub 
        ? `in ${selectedOptions.style.sub} ${selectedOptions.style.main.toLowerCase()} style`
        : `in ${selectedOptions.style.main} style`;
      parts.push(styleText);
    }
    if (selectedOptions.emotion.main) {
      const emotionText = selectedOptions.emotion.sub
        ? `with a ${selectedOptions.emotion.sub} ${selectedOptions.emotion.main.toLowerCase()} mood`
        : `with a ${selectedOptions.emotion.main.toLowerCase()} mood`;
      parts.push(emotionText);
    }
    if (selectedOptions.lighting.main) {
      const lightingText = selectedOptions.lighting.sub
        ? `featuring ${selectedOptions.lighting.sub} ${selectedOptions.lighting.main.toLowerCase()}`
        : `featuring ${selectedOptions.lighting.main.toLowerCase()}`;
      parts.push(lightingText);
    }
    if (selectedOptions.composition) parts.push(`from a ${selectedOptions.composition.toLowerCase()} perspective`);
    if (selectedOptions.timePeriod) parts.push(`set in ${selectedOptions.timePeriod}`);
    if (selectedOptions.extraDetails) parts.push(`with ${selectedOptions.extraDetails.toLowerCase()} effects`);
    
    return parts.join(', ');
  };

  const handleSupercharge = async () => {
    try {
      setIsSuperchargeLoading(true);
      const response = await fetch(`${API_URL}/rewrite-tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tweet: generatedPrompt || generatePrompt(),
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
        throw new Error('Failed to supercharge prompt');
      }
      
      const data = await response.json();
      if (!data.rewrittenTweets || !data.rewrittenTweets.length) {
        throw new Error('Invalid response format');
      }
      
      setSuperchargedPrompt(data.rewrittenTweets[0]);
    } catch (error) {
      console.error('Error supercharging prompt:', error);
      alert(error.message || 'Failed to supercharge prompt. Please try again.');
    } finally {
      setIsSuperchargeLoading(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt || generatePrompt());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySupercharged = () => {
    navigator.clipboard.writeText(superchargedPrompt);
    setIsSuperchargedCopied(true);
    setTimeout(() => setIsSuperchargedCopied(false), 2000);
  };

  const handleGenerateWithFlux = async (fromSupercharged = false) => {
    try {
      setIsGenerateLoading(true);
      setGeneratedImages([]); // Clear previous images
      setShowImageGrid(false);
      
      // Get the appropriate prompt and aspect ratio based on which section triggered the generation
      const promptToUse = fromSupercharged ? superchargedPrompt : (generatedPrompt || generatePrompt());
      const aspectRatioToUse = fromSupercharged ? superchargedAspectRatio : selectedAspectRatio;
      
      console.log('Sending prompt to generate images:', promptToUse);
      console.log('Using aspect ratio:', aspectRatioToUse);
      
      // Call the backend endpoint
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          prompt: promptToUse,
          aspectRatio: aspectRatioToUse,
          num_outputs: 2
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to generate image');
      }
      
      const data = await response.json();
      console.log('Received image data:', data);
      
      if (!data.images || !Array.isArray(data.images)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Use the images directly from the server response
      setGeneratedImages(data.images);
      setShowImageGrid(true);
      
    } catch (error) {
      console.error('Error generating images:', error);
      alert(error.message || 'Failed to generate images. Please try again.');
    } finally {
      setIsGenerateLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="feature-description">
          <p>Create stunning AI image generation prompts with our intelligent assistant. Select from curated options across multiple categories to build detailed, professional-grade prompts that will help you achieve the exact visual results you're looking for.</p>
        </div>
        
        <div className="prompt-categories">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="category-section">
              <h3>{category.title}</h3>
              {key === 'style' ? (
                <div className="style-selector">
                  <select
                    value={selectedOptions.style.main}
                    onChange={(e) => {
                      const selectedMain = e.target.value;
                      handleStyleChange(selectedMain, '');
                    }}
                    disabled={isSuperchargeLoading || isGenerateLoading}
                  >
                    <option value="">Select Style & Medium</option>
                    {category.options.map(style => (
                      <option key={style.main} value={style.main}>
                        {style.main}
                      </option>
                    ))}
                  </select>
                  
                  {selectedOptions.style.main && (
                    <select
                      value={selectedOptions.style.sub}
                      onChange={(e) => {
                        handleStyleChange(selectedOptions.style.main, e.target.value);
                      }}
                      disabled={isSuperchargeLoading || isGenerateLoading}
                      className="subcategory-select"
                    >
                      <option value="">Select {selectedOptions.style.main} Style</option>
                      {category.options
                        .find(style => style.main === selectedOptions.style.main)
                        ?.subcategories.map(sub => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ) : key === 'emotion' ? (
                <div className="style-selector">
                  <select
                    value={selectedOptions.emotion.main}
                    onChange={(e) => {
                      const selectedMain = e.target.value;
                      setSelectedOptions(prev => ({
                        ...prev,
                        emotion: {
                          main: selectedMain,
                          sub: ''
                        }
                      }));
                    }}
                    disabled={isSuperchargeLoading || isGenerateLoading}
                  >
                    <option value="">Select Emotion & Mood</option>
                    {category.options.map(emotion => (
                      <option key={emotion.main} value={emotion.main}>
                        {emotion.main}
                      </option>
                    ))}
                  </select>
                  
                  {selectedOptions.emotion.main && (
                    <select
                      value={selectedOptions.emotion.sub}
                      onChange={(e) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          emotion: {
                            ...prev.emotion,
                            sub: e.target.value
                          }
                        }));
                      }}
                      disabled={isSuperchargeLoading || isGenerateLoading}
                      className="subcategory-select"
                    >
                      <option value="">Select {selectedOptions.emotion.main} Mood</option>
                      {category.options
                        .find(emotion => emotion.main === selectedOptions.emotion.main)
                        ?.subcategories.map(sub => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ) : key === 'lighting' ? (
                <div className="style-selector">
                  <select
                    value={selectedOptions.lighting.main}
                    onChange={(e) => {
                      const selectedMain = e.target.value;
                      setSelectedOptions(prev => ({
                        ...prev,
                        lighting: {
                          main: selectedMain,
                          sub: ''
                        }
                      }));
                    }}
                    disabled={isSuperchargeLoading || isGenerateLoading}
                  >
                    <option value="">Select Lighting & Atmosphere</option>
                    {category.options.map(lighting => (
                      <option key={lighting.main} value={lighting.main}>
                        {lighting.main}
                      </option>
                    ))}
                  </select>
                  
                  {selectedOptions.lighting.main && (
                    <select
                      value={selectedOptions.lighting.sub}
                      onChange={(e) => {
                        setSelectedOptions(prev => ({
                          ...prev,
                          lighting: {
                            ...prev.lighting,
                            sub: e.target.value
                          }
                        }));
                      }}
                      disabled={isSuperchargeLoading || isGenerateLoading}
                      className="subcategory-select"
                    >
                      <option value="">Select {selectedOptions.lighting.main} Effect</option>
                      {category.options
                        .find(lighting => lighting.main === selectedOptions.lighting.main)
                        ?.subcategories.map(sub => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
              ) : (
                <select
                  value={selectedOptions[key]}
                  onChange={(e) => handleOptionChange(key, e.target.value)}
                  disabled={isSuperchargeLoading || isGenerateLoading}
                >
                  <option value="">Select {category.title}</option>
                  {category.options.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {Object.values(selectedOptions).some(value => value) && (
          <div className="prompt-result">
            <h3>Generated Prompt:</h3>
            <div className="prompt-text">
              <textarea
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                className="prompt-edit-textarea"
                rows={2}
              />
            </div>
            <div className="button-row">
              <button 
                className="copy-button"
                onClick={handleCopyPrompt}
                disabled={isSuperchargeLoading || isGenerateLoading}
              >
                {isCopied ? 'Copied!' : 'Copy Prompt'}
              </button>
              <button 
                className="supercharge-button"
                onClick={handleSupercharge}
                disabled={isSuperchargeLoading || isGenerateLoading}
              >
                {isSuperchargeLoading ? <LoadingSpinner size="inline" /> : 'Supercharge Prompt'}
              </button>
              <div className="generate-image-section">
                <div className="button-group">
                  <select
                    value={selectedAspectRatio}
                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    className="aspect-ratio-select"
                    disabled={isSuperchargeLoading || isGenerateLoading}
                  >
                    {aspectRatios.map(ratio => (
                      <option key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => handleGenerateWithFlux(false)}
                    disabled={isSuperchargeLoading || isGenerateLoading}
                    style={{
                      background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                      color: 'white',
                      border: 'none',
                      width: '129.64px',
                      height: '36px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      opacity: isSuperchargeLoading || isGenerateLoading ? 0.7 : 1,
                      pointerEvents: isSuperchargeLoading || isGenerateLoading ? 'none' : 'auto'
                    }}
                  >
                    {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate with Flux'}
                  </button>
                </div>
              </div>
            </div>

            {superchargedPrompt && (
              <div className="supercharged-result">
                <h3>Supercharged Prompt:</h3>
                <div className="prompt-text">
                  <textarea
                    value={superchargedPrompt}
                    onChange={(e) => setSuperchargedPrompt(e.target.value)}
                    className="prompt-edit-textarea"
                    rows={4}
                  />
                </div>
                <div className="button-row">
                  <div className="generate-image-section">
                    <div className="button-group">
                      <button 
                        className="copy-button"
                        onClick={handleCopySupercharged}
                        disabled={isSuperchargeLoading || isGenerateLoading}
                      >
                        {isSuperchargedCopied ? 'Copied!' : 'Copy Supercharged Prompt'}
                      </button>
                      <select
                        value={superchargedAspectRatio}
                        onChange={(e) => setSuperchargedAspectRatio(e.target.value)}
                        className="aspect-ratio-select"
                        disabled={isSuperchargeLoading || isGenerateLoading}
                      >
                        {aspectRatios.map(ratio => (
                          <option key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleGenerateWithFlux(true)}
                        disabled={isSuperchargeLoading || isGenerateLoading}
                        style={{
                          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                          color: 'white',
                          border: 'none',
                          width: '129.64px',
                          height: '36px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          opacity: isSuperchargeLoading || isGenerateLoading ? 0.7 : 1,
                          pointerEvents: isSuperchargeLoading || isGenerateLoading ? 'none' : 'auto'
                        }}
                      >
                        {isGenerateLoading ? <LoadingSpinner size="inline" /> : 'Generate with Flux'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showImageGrid && generatedImages.length > 0 && (
        <div className="generated-images-container">
          <h3>Generated Images:</h3>
          <div className="image-grid">
            {generatedImages.map((image, index) => (
              <div key={index} className="image-item">
                <img 
                  src={image.originalUrl} 
                  alt={`Generated ${index + 1}`}
                  onError={(e) => {
                    console.error('Image failed to load:', image.originalUrl);
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjNjY2Ij5JbWFnZSBmYWlsZWQgdG8gbG9hZDwvdGV4dD48L3N2Zz4=';
                  }}
                  onClick={() => {
                    console.log('Opening image in new tab:', image.originalUrl);
                    window.open(image.originalUrl, '_blank');
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this CSS at the end of your existing CSS file or in a new style tag
const styles = `
  .generated-images-container {
    margin-top: 20px;
    padding: 20px;
    background: rgba(30, 32, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    color: #ffffff;
  }

  .generated-images-container h3 {
    margin: 0 0 16px 0;
    font-size: 1.2rem;
    background: linear-gradient(135deg, #00c2ff, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-top: 16px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }

  .image-item {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(25, 27, 35, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    width: 100%;
    height: auto;
  }

  .image-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 194, 255, 0.2);
  }

  .image-item img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }

  .aspect-ratio-select {
    padding: 8px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background-color: #ffffff;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 140px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 32px;
  }

  .aspect-ratio-select:hover {
    border-color: #0070f3;
  }

  .aspect-ratio-select:focus {
    outline: none;
    border-color: #0070f3;
    box-shadow: 0 0 0 3px rgba(0, 112, 243, 0.1);
  }

  .aspect-ratio-select:disabled {
    background-color: #f5f5f5;
    border-color: #ddd;
    color: #999;
    cursor: not-allowed;
    opacity: 0.7;
  }

  .button-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  @media (max-width: 768px) {
    .button-group {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .aspect-ratio-select {
      width: 100%;
    }

    .image-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .generated-images-container {
      padding: 15px;
      margin: 15px 0;
    }
  }

  .style-selector {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .style-selector select {
    width: 100%;
    background: #23242b;
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 8px 15px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 32px;
  }

  .style-selector select:focus {
    outline: none;
    border-color: rgba(168, 85, 247, 0.4);
    box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
  }

  .style-selector select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .style-selector select option {
    background-color: #23242b;
    color: #fff;
    padding: 8px;
  }

  .style-selector .subcategory-select {
    margin-top: 5px;
  }

  @media (max-width: 768px) {
    .style-selector {
      gap: 8px;
    }
  }
`;

// Insert styles into document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet); 