require('dotenv').config();  // Move this to very top
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const Replicate = require('replicate');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const authMiddleware = require('./middleware/auth');
// const axios = require('axios');  // Commented out for now

// Utility function to replace em-dashes with hyphens
const replaceEmDash = (text) => text.replace(/—/g, '-');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
console.log('Resend configured:', !!process.env.RESEND_API_KEY);

// Server startup timestamp
const startupTime = new Date().toISOString();
console.log('Server initializing at:', startupTime);

// Log database connection info (temporary)
console.log('Database URL configured:', !!process.env.DATABASE_URL);
console.log('Database URL domain:', process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'not found');
console.log('Admin credentials configured:', {
  hasEmail: !!process.env.ADMIN_EMAIL,
  hasPassword: !!process.env.ADMIN_PASSWORD
});

const app = express();

// Update body-parser limits to handle larger payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// More permissive CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://tweet-optimizer.vercel.app',
    'https://tweet-optimizer-production-8f8e.up.railway.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600
}));

// Update the headers middleware to be more permissive
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Auth routes
app.use('/auth', authRoutes);
// Admin routes
console.log('Setting up admin routes...');
app.use('/admin', adminRoutes);
console.log('Admin routes configured');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Commented out xAI client for now
/*
const xaiClient = axios.create({
  baseURL: 'https://api.x.ai/v1',
  headers: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
*/

// Place this BEFORE any other middleware or routes
app.options('*', cors()) // Enable pre-flight for all routes

// Add this function at the top level of server.js, before the endpoints
const getHookInstruction = (hookType) => {
  switch(hookType) {
    case 'curiosity':
      return "Transform the opening to create a strong curiosity gap. Make readers think 'I NEED to know more.' Start with phrases like 'The truth about...', 'What nobody tells you...', 'The secret to...', or 'Here's why...'. Focus on the mystery or revelation.";
    case 'controversial':
      return "Start with a bold, thought-provoking statement that challenges common beliefs or assumptions. Create healthy debate without being offensive. Use phrases like 'Unpopular opinion:', 'Here's what everyone gets wrong:', or 'Stop believing this myth:'. The opening should make people pause and think 'Wait, what?'";
    case 'number':
      return "Transform this into a compelling list-style hook. Start with numbers like '3 brutal truths about...', '5 reasons why...', or 'The 2 things nobody tells you about...'. Make each point feel valuable and unexpected.";
    case 'shock':
      return "Open with a dramatic, attention-grabbing statement that stops people mid-scroll. Use surprising statistics, unexpected revelations, or counter-intuitive facts. Make it impossible to scroll past without reading more.";
    case 'relatable':
      return "Start with a highly relatable, 'calling you out' style opening that makes people think 'This is so me!' or 'How did they know?' Use conversational, personal language that feels like a friend telling a truth everyone thinks but nobody says.";
    default:
      return "";
  }
};

// Endpoint for rewriting tweets
app.post('/rewrite-tweet', authMiddleware, async (req, res) => {
  try {
    const { tweet, tones, tone, hook, customInstructions } = req.body;
    
    const hookInstruction = customInstructions || getHookInstruction(hook);
    
    // Handle Prompt Assistant's supercharge feature
    if (tone) {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            "role": "system", 
            "content": `You are a prompt enhancement expert. Your task is to enhance prompts to make them more detailed and effective.

IMPORTANT RULES:
- Keep the core subject and style of the original
- Add specific details and technical aspects
- Use natural, descriptive language
- Format as a single, cohesive prompt
- Do not use hashtags or emojis unless they were in the original`
          },
          {
            "role": "user",
            "content": `${customInstructions}\n\nContent: ${tweet}`
          }
        ],
        temperature: 0.7,
        n: 1  // Single variation for Prompt Assistant
      });

      const rewrittenTweets = [completion.choices[0].message.content.trim()];
      return res.json({ rewrittenTweets });
    }
    
    // Handle Post Optimizer feature
    // Validate tones array
    if (!Array.isArray(tones) || tones.length < 1 || tones.length > 2) {
      return res.status(400).json({ error: 'Please select 1 or 2 tones' });
    }
    
    // Create tone instruction
    const toneInstruction = tones.length === 1
      ? `Rewrite this content in a ${tones[0]} tone.`
      : `Rewrite this content by blending ${tones[0]} and ${tones[1]} tones. Create a unique voice that combines the best aspects of both tones.`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system", 
          "content": `You are a social media optimization expert. Your task is to rewrite posts to make them more engaging while maintaining their core message.

IMPORTANT RULES:
- Keep the same approximate length as the original
- Maintain the core message and intent
- Use natural, conversational language
- Format as a single, cohesive post
- Do not use hashtags or emojis unless they were in the original`
        },
        {
          "role": "user",
          "content": `${toneInstruction}\n\n${hookInstruction}\n\nContent: ${tweet}`
        }
      ],
      temperature: 0.7,
      n: 3  // Three variations for Post Optimizer
    });

    // Get all variations and ensure they're properly formatted
    const rewrittenTweets = completion.choices.map(choice => 
      replaceEmDash(choice.message.content.trim())
    );
    
    res.json({ rewrittenTweets });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error rewriting content' });
  }
});

// Commented out trending topics endpoint for now
/*
app.get('/trending-topics', async (req, res) => {
  try {
    const response = await xaiClient.post('/chat/completions', {
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are Grok, with real-time access to X's data. Your task is to analyze X activity from exactly the last 2 hours, from the moment this request is made."
        },
        {
          role: "user",
          content: `Please provide two separate lists based on X (Twitter) data from the last 2 hours only:

LIST 1 - TRENDING TOPICS:
Provide 10 current trending topics/conversations on X. Include:
- Topic name

LIST 2 - POPULAR KEYWORDS:
List 10 individual keywords that are being frequently used in posts on X. Include:
- The keyword
- Context of its usage

Focus only on data from the last 2 hours. Format each list clearly and separately.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('xAI Response:', response.data);

    res.json({ trends: response.data.choices[0].message.content });
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error fetching trending topics', details: error.message });
  }
});
*/

// Add new endpoint for tweet analysis
app.post('/analyze-tweet', authMiddleware, async (req, res) => {
  try {
    const { tweet } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": "You are a tweet analysis expert. Analyze the given tweet and provide insights about its structure, tone, and effectiveness."
        },
        {
          "role": "user",
          "content": `Analyze this tweet: ${tweet}`
        }
      ],
    });

    const analysis = replaceEmDash(completion.choices[0].message.content);
    res.json({ analysis });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error analyzing tweet' });
  }
});

// Add new endpoint for personalized adaptation
app.post('/adapt-tweet', async (req, res) => {
  try {
    const { tweet, analysis } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `You are a tweet adaptation expert. Your task is to create a personalized version of a tweet while maintaining its successful elements.

Given a tweet and its analysis, create a new version that:
1. Maintains the same structural elements that made it successful
2. Uses the same type of hook and engagement triggers
3. Aims for the same emotional response
4. Keeps the core message but makes it fresh and unique

Provide a single, well-crafted adaptation that could stand alone as its own tweet.
Keep the length similar to the original.
Do not use hashtags or emojis in the response.`
        },
        {
          "role": "user",
          "content": `Original Tweet: ${tweet}

Analysis:
${JSON.stringify(analysis, null, 2)}

Create a personalized adaptation:`
        }
      ],
    });

    const adaptedTweet = replaceEmDash(completion.choices[0].message.content.trim());
    res.json({ adaptedTweet });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error adapting tweet' });
  }
});

// Add new endpoint for power words analysis
app.post('/analyze-power-words', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `You are a tweet optimization expert. Analyze the tweet and provide improvements in this exact JSON format:

{
  "analysis": "Brief 2-3 sentence analysis of current tweet",
  "improvements": [
    {
      "category": "Emotional Impact",
      "example": "Complete rewritten tweet using emotional words",
      "words_used": ["word1", "word2", "word3"]
    },
    {
      "category": "Urgency and Scarcity",
      "example": "Complete rewritten tweet using urgency words",
      "words_used": ["word1", "word2", "word3"]
    },
    {
      "category": "Action-Oriented",
      "example": "Complete rewritten tweet using action words",
      "words_used": ["word1", "word2", "word3"]
    },
    {
      "category": "Social Proof & FOMO",
      "example": "Complete rewritten tweet using social proof",
      "words_used": ["word1", "word2", "word3"]
    },
    {
      "category": "Clarity and Focus",
      "example": "Complete rewritten tweet focusing on clarity",
      "words_used": ["word1", "word2", "word3"]
    }
  ]
}

IMPORTANT:
- Keep each example concise and Twitter-length
- No hashtags or emojis
- Focus on natural integration of power words
- Maintain the core message`
        },
        {
          "role": "user",
          "content": `Analyze and improve this tweet: ${text}`
        }
      ],
    });

    // Parse the JSON response
    const result = JSON.parse(replaceEmDash(completion.choices[0].message.content));

    // Map the improvements to the UI format
    const suggestions = result.improvements.map(imp => ({
      category: imp.category,
      words: imp.words_used,
      example: imp.example
    }));

    res.json({ 
      analysis: result.analysis,
      suggestions 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error analyzing power words' });
  }
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: {
        code: error.code,
        database: process.env.DATABASE_URL ? 'URL configured' : 'URL missing',
        connectionError: error.toString()
      }
    });
  }
});

// Initialize database
const initializeDb = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
    await db.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
  }
};

// Call initialization when server starts
initializeDb();

// Feature flag for auth
const ENFORCE_AUTH = false;

// Add this before routes
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});

// Log configuration info
console.log('Server configuration:', {
  databaseConfigured: !!process.env.DATABASE_URL,
  adminConfigured: {
    hasEmail: !!process.env.ADMIN_EMAIL,
    hasPassword: !!process.env.ADMIN_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET
  },
  adminEmail: process.env.ADMIN_EMAIL,  // Log actual email for verification
  port: process.env.PORT || 3001
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    headers: req.headers
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.path
  });
});

// Image to Prompt endpoint
app.post('/analyze-image', authMiddleware, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('Attempting to analyze image with OpenAI...');
    console.log('OpenAI API Key configured:', !!process.env.OPENAI_API_KEY);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Generate a detailed prompt that describes this image. Include details about composition, style, lighting, mood, colors, and technical aspects. Format it in a way that would be useful for AI image generation." 
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ],
          }
        ],
        max_tokens: 500
      });

      const generatedPrompt = response.choices[0].message.content;
      res.json({ prompt: generatedPrompt });
    } catch (openaiError) {
      console.error('OpenAI API Error:', {
        message: openaiError.message,
        type: openaiError.type,
        code: openaiError.code,
        param: openaiError.param,
        stack: openaiError.stack
      });
      throw openaiError;
    }
  } catch (error) {
    console.error('Error analyzing image:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message,
      type: error.type,
      code: error.code
    });
  }
});

// Evergreen Content endpoint
app.post('/generate-evergreen-content', authMiddleware, async (req, res) => {
  try {
    const { niche, format, length } = req.body;
    
    if (!niche || !format || !length) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const { hookTemplates, contentLengths } = require('./data/evergreen-data');

    // Fisher-Yates shuffle implementation
    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // Randomly select 5 hooks using Fisher-Yates shuffle
    const shuffledHooks = shuffleArray([...hookTemplates]);
    const selectedHooks = shuffledHooks.slice(0, 5);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `You are tasked with creating a social media post for a specific niche. Here's what you need to do:

1. **Niche**: The user has selected the niche **${niche}**.
2. **Hook**: Select ONE hook from the following options tailored to this niche:
    ${selectedHooks.join('\n    ')}
    (Select one hook from these 5 options)

3. **Post Format**: The user has selected this format:
    **${format}**

4. **CRITICAL - Content Length Requirements**:
    You MUST create content that is EXACTLY within these limits:
    - Short form: Maximum ${contentLengths.short} characters (not words, characters)
      Example length: "Want to boost your productivity? Here's a simple trick I learned: take 5-minute breaks every 25 minutes. It's called the Pomodoro Technique, and it works wonders for focus."
    
    - Medium form: Maximum ${contentLengths.medium} characters (not words, characters)
      Example length: "Want to boost your productivity? Here's a simple trick I learned: take 5-minute breaks every 25 minutes. It's called the Pomodoro Technique, and it works wonders for focus. The science behind it is fascinating - our brains naturally work in cycles of about 25 minutes. After that, our attention starts to drift. By taking short breaks, we reset our focus and maintain peak performance throughout the day. Try it tomorrow and let me know if you notice the difference!"
    
    - Long form: Maximum ${contentLengths.long} characters (not words, characters)
      Example length: "Want to boost your productivity? Here's a simple trick I learned: take 5-minute breaks every 25 minutes. It's called the Pomodoro Technique, and it works wonders for focus. The science behind it is fascinating - our brains naturally work in cycles of about 25 minutes. After that, our attention starts to drift. By taking short breaks, we reset our focus and maintain peak performance throughout the day. The technique was developed by Francesco Cirillo in the late 1980s, and it's been proven effective by countless studies. The key is consistency - stick to the 25/5 pattern, and you'll see your productivity soar. I've been using this method for years, and it's transformed how I work. The best part? It's completely free and requires no special tools. Just a timer and your commitment to better work habits. Try it tomorrow and let me know if you notice the difference!"
    
    IMPORTANT: 
    - Count your characters carefully
    - If you exceed the limit, you must revise and shorten your content
    - Do not include any content that would push you over the limit
    - The character count includes ALL text, including spaces and punctuation

5. **Instructions**: 
    - Begin with the selected hook as your opening line, but integrate it naturally into the content without any labels or formatting
    - Follow the selected post format structure, but do not include any format labels or markdown
    - Create content that is:
        - Engaging and valuable to the target audience
        - Focused on providing actionable advice or insight
        - Not too promotional—focus on delivering value first
        - Keep the tone and style consistent with the selected niche
        - MUST stay within the exact character limit specified above

6. **Output Format**:
    - Start with the hook naturally integrated into the first paragraph
    - Continue with the main content following the selected format
    - Include a call to action only if the format is specifically "A Call-to-Action Post"
    - Do not include any labels, markdown formatting, or structural indicators
    - The content should flow naturally as a single, cohesive post
    - FINAL CHECK: Verify your content is within the character limit before submitting

The post should feel natural and authentic to the niche while incorporating the selected hook and format type. UNDER NO CIRCUMSTANCES should the content exceed the specified character limit. Present the content as a single, flowing piece without any structural labels or formatting.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const generatedContent = replaceEmDash(completion.choices[0].message.content.trim());
    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error generating content' });
  }
});

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Add this before the module.exports
app.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { prompt, aspectRatio, num_outputs = 2 } = req.body;  // Default to 2 if not specified
    console.log('Generating image with prompt:', prompt);
    console.log('Aspect ratio:', aspectRatio);
    console.log('Number of outputs:', num_outputs);

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Convert aspect ratio to width and height
    let width, height;
    
    switch (aspectRatio) {
      case '16:9':
        width = 1024;
        height = Math.round(1024 * (9/16));  // 576
        break;
      case '9:16':
        height = 1024;
        width = Math.round(1024 * (9/16));   // 576
        break;
      case '4:3':
        width = 1024;
        height = Math.round(1024 * (3/4));   // 768
        break;
      case '3:4':
        height = 1024;
        width = Math.round(1024 * (3/4));    // 768
        break;
      default: // 1:1
        width = 1024;
        height = 1024;
    }

    console.log('Using dimensions:', { width, height, aspectRatio });
    console.log('Replicate API Token configured:', !!process.env.REPLICATE_API_TOKEN);

    // Create the prediction
    const prediction = await replicate.predictions.create({
      version: "5e40e75f3c8a8b1b3f2d3f9723a5b205f4b8d7a2a82ec2af9c09b9f1e6688c05",
      input: {
        prompt: prompt,
        go_fast: true,
        num_outputs: num_outputs,
        num_inference_steps: 4,
        guidance_scale: 7.5,
        output_format: "png",
        width: width,
        height: height,
        scheduler: "K_EULER",
        seed: Math.floor(Math.random() * 1000000)
      }
    });

    console.log('Prediction created:', prediction);

    // Wait for the prediction to complete
    let finalPrediction = await replicate.predictions.get(prediction.id);

    // Keep polling until the prediction is complete
    while (finalPrediction.status !== "succeeded" && finalPrediction.status !== "failed") {
      console.log('Waiting for prediction...', finalPrediction.status);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      finalPrediction = await replicate.predictions.get(prediction.id);
    }

    console.log('Final prediction:', finalPrediction);

    if (finalPrediction.status === "failed") {
      throw new Error(finalPrediction.error || 'Image generation failed');
    }

    // The output should be in finalPrediction.output
    if (!finalPrediction.output || !Array.isArray(finalPrediction.output)) {
      console.error('Unexpected output format:', finalPrediction);
      throw new Error('Invalid response format from image generation API');
    }

    // Filter out any non-string or empty values
    const validUrls = finalPrediction.output.filter(url => {
      if (typeof url !== 'string' || !url) {
        console.error('Invalid URL in output:', url);
        return false;
      }
      try {
        new URL(url);
        return true;
      } catch (error) {
        console.error('Invalid URL format:', url, error);
        return false;
      }
    });

    console.log('Filtered valid URLs:', validUrls);

    if (validUrls.length === 0) {
      throw new Error('No valid image URLs were generated');
    }

    res.json({ imageUrl: validUrls });
  } catch (error) {
    console.error('Error generating image:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Error generating image', 
      details: error.message,
      type: error.name,
      code: error.code
    });
  }
});