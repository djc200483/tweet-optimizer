import React, { useState } from 'react';

export default function PromptAssistant() {
  const [selectedOptions, setSelectedOptions] = useState({
    subject: '',
    resolution: '',
    style: '',
    emotion: '',
    lighting: '',
    composition: '',
    timePeriod: '',
    extraDetails: ''
  });

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
      options: ['Photorealistic', 'Digital Painting', 'Sketch', 'Line Art', 'Watercolor', 
                'Oil Painting', '3D Rendered', 'Cyberpunk', 'Futuristic', 'Vintage', 'Retro', 
                'Surreal', 'Dreamlike', 'Noir', 'Dark Aesthetic', 'Pixel Art', '8-bit', 
                'Ukiyo-e', 'Traditional Asian Art', 'Impressionist', 'Classical Painting']
    },
    emotion: {
      title: 'Emotion & Mood',
      options: ['Happy', 'Joyful', 'Mysterious', 'Intriguing', 'Dark', 'Ominous', 'Epic', 
                'Grand', 'Melancholic', 'Sad', 'Inspirational', 'Uplifting', 'Peaceful', 
                'Serene', 'Eerie', 'Uncanny', 'Action-Packed', 'Intense']
    },
    lighting: {
      title: 'Lighting & Atmosphere',
      options: ['Warm Golden Hour', 'Cold Lighting', 'Moody Lighting', 'High Contrast', 
                'Dramatic Lighting', 'Soft Glow', 'Ethereal Glow', 'Foggy', 'Hazy', 
                'Cyberpunk Neon Glow', 'Vintage Film Grain', 'Harsh Shadows', 'Noir Style', 
                'Dreamlike Filters', 'Surreal Filters']
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

  const handleOptionChange = (category, value) => {
    setSelectedOptions({
      ...selectedOptions,
      [category]: value
    });
  };

  const generatePrompt = () => {
    const parts = [];
    
    if (selectedOptions.subject) parts.push(selectedOptions.subject);
    if (selectedOptions.resolution) parts.push(`in ${selectedOptions.resolution}`);
    if (selectedOptions.style) parts.push(`in ${selectedOptions.style} style`);
    if (selectedOptions.emotion) parts.push(`with a ${selectedOptions.emotion.toLowerCase()} mood`);
    if (selectedOptions.lighting) parts.push(`featuring ${selectedOptions.lighting.toLowerCase()} lighting`);
    if (selectedOptions.composition) parts.push(`from a ${selectedOptions.composition.toLowerCase()} perspective`);
    if (selectedOptions.timePeriod) parts.push(`set in ${selectedOptions.timePeriod}`);
    if (selectedOptions.extraDetails) parts.push(`with ${selectedOptions.extraDetails.toLowerCase()} effects`);
    
    return parts.join(', ');
  };

  return (
    <div className="tab-content">
      <div className="input-container">
        <div className="testing-instructions">
          <p>Testing Instructions - Select options from each category to generate an image prompt</p>
        </div>
        
        <div className="prompt-categories">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key} className="category-section">
              <h3>{category.title}</h3>
              <select
                value={selectedOptions[key]}
                onChange={(e) => handleOptionChange(key, e.target.value)}
              >
                <option value="">Select {category.title}</option>
                {category.options.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {Object.values(selectedOptions).some(value => value) && (
          <div className="prompt-result">
            <h3>Generated Prompt:</h3>
            <div className="prompt-text">
              {generatePrompt()}
            </div>
            <button 
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(generatePrompt())}
            >
              Copy Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 