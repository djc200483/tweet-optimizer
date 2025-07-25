require('dotenv').config();  // Move this to very top
require('./cron'); // Add this line near the top with other imports

// Add debug logging for environment variables
console.log('Environment variables loaded:', {
  hasDbUrl: !!process.env.DATABASE_URL,
  dbUrlStart: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not found',
  nodeEnv: process.env.NODE_ENV,
  pwd: process.cwd()
});

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
const imageRoutes = require('./routes/images');
const authMiddleware = require('./middleware/auth');
const migrate = require('./db/migrate');
const sharp = require('sharp');
const axios = require('axios');

// Run migrations on startup
console.log('Running database migrations...');
migrate('up').then(() => {
  console.log('Migrations completed successfully');
}).catch(error => {
  console.error('Error running migrations:', error);
});

// Check if this is a migration command
if (process.argv[2] === 'migrate') {
  const direction = process.argv[3] === 'down' ? 'down' : 'up';
  require('./db/migrate')(direction);
  return;
}

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

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://tweet-optimizer.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600
}));

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
// Image routes
app.use('/api/images', imageRoutes);
console.log('Image routes configured');

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
        model: "gpt-4o-mini",
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

// Import S3 service
const { uploadImageToS3, uploadImageBufferToS3 } = require('./s3Service');

// Add logging for Replicate configuration
console.log('Replicate API Token configured:', {
  exists: !!process.env.REPLICATE_API_TOKEN,
  length: process.env.REPLICATE_API_TOKEN?.length,
  prefix: process.env.REPLICATE_API_TOKEN?.substring(0, 4)
});

// Add this before the module.exports
app.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { prompt, aspectRatio, num_outputs = 2, model, sourceImageBase64 } = req.body;
    const userId = req.user.id;
    console.log('=== Starting image generation process ===');
    console.log('Request details:', {
      prompt,
      aspectRatio,
      num_outputs,
      userId,
      model,
      hasSourceImage: !!sourceImageBase64
    });

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API Token is not configured');
    }

    // Only require prompt for models that need it, or for expand/image-to-prompt/enhance generation types
    const modelNeedsPrompt = !['flux-kontext-apps/portrait-series'].includes(model);
    const isExpandGeneration = req.body.generation_type === 'expand';
    const isImageToPromptGeneration = req.body.generation_type === 'image-to-prompt';
    const isEnhanceGeneration = req.body.generation_type === 'enhance';
    if (modelNeedsPrompt && !prompt && !isExpandGeneration && !isImageToPromptGeneration && !isEnhanceGeneration) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Handle image-to-image: upload image to S3 if provided
    let imageS3Url = null;
    if (sourceImageBase64) {
      // Decode base64 and upload to S3
      const buffer = Buffer.from(sourceImageBase64, 'base64');
      const timestamp = Date.now();
      const key = `user-images/${userId}/${timestamp}.png`;
      const s3Result = await uploadImageBufferToS3(buffer, key);
      if (!s3Result.success) {
        return res.status(500).json({ error: 'Failed to upload image to S3', details: s3Result.error });
      }
      imageS3Url = s3Result.s3Url;
    }

    // Handle DALL-E 3 model specifically
    if (model === 'openai/dall-e-3') {
      // Size mapping function for DALL-E 3
      const getDallE3Size = (aspectRatio) => {
        switch(aspectRatio) {
          case '1:1': return '1024x1024';
          case '16:9': return '1792x1024';
          case '9:16': return '1024x1792';
          default: return '1024x1024';
        }
      };

      // Use OpenAI API for DALL-E 3
      const openaiResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1, // DALL-E 3 only generates 1 image
        size: getDallE3Size(aspectRatio),
        quality: "hd", // Always HD as requested
        style: req.body.style || "vivid" // Default to vivid, allow toggle
      });
      
      // Process single image response
      const imageUrl = openaiResponse.data[0].url;
      
      // Continue with existing S3 upload and database save workflow
      const timestamp = new Date().getTime();
      const key = `images/${userId}/${timestamp}-0.png`;
      const s3Result = await uploadImageToS3(imageUrl, key);
      if (!s3Result.success) {
        console.error('Failed to upload to S3:', s3Result.error);
        return res.status(500).json({ error: 'Failed to upload image to S3', details: s3Result.error });
      }
      
      try {
        const result = await db.query(
          'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, aspect_ratio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userId, prompt, imageUrl, s3Result.s3Url, aspectRatio || '1:1']
        );
        
        const processedImage = {
          originalUrl: imageUrl,
          s3Url: s3Result.s3Url,
          id: result.rows[0].id
        };
        
        console.log('=== DALL-E 3 image processing complete ===');
        console.log('Processed image:', processedImage);
        res.json({ images: [processedImage] });
        return;
      } catch (dbError) {
        console.error('Database error:', dbError);
        return res.status(500).json({ error: 'Failed to save to database' });
      }
    }

    // Build Replicate input
    let replicateInput = {};
    
    // Handle bytedance model specifically
    if (model === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe') {
      replicateInput = {
        prompt: prompt,
        width: req.body.width || 1024,
        height: req.body.height || 1024,
        seed: req.body.seed || 0,
        num_outputs: req.body.num_outputs || 2,
        num_inference_steps: req.body.num_inference_steps || 4
      };
    } else {
      // Standard Flux model parameters
      replicateInput = {
        prompt: prompt,
        go_fast: true,
        num_outputs: model === 'minimax/image-01' ? 2 : ([
          'black-forest-labs/flux-1.1-pro',
          'black-forest-labs/flux-1.1-pro-ultra',
          'google/imagen-4'
        ].includes(model) ? 1 : 4),
        num_inference_steps: 4,
        guidance_scale: 7.5,
        output_format: 'png',
        aspect_ratio: aspectRatio,
        seed: Math.floor(Math.random() * 1000000)
      };
      
      // Add safety_tolerance for flux-1.1-pro-ultra model
      if (model === 'black-forest-labs/flux-1.1-pro-ultra') {
        replicateInput.safety_tolerance = 5;
      }
    }

    // Add style parameter for recraft-ai/recraft-v3
    if (model === 'recraft-ai/recraft-v3' && req.body.style) {
      replicateInput['style'] = req.body.style;
    }

    // Add image parameter for image-to-image
    if (imageS3Url) {
      if (model === 'minimax/image-01') {
        replicateInput['subject_reference'] = imageS3Url;
      } else if (
        model === 'black-forest-labs/flux-1.1-pro' ||
        model === 'black-forest-labs/flux-1.1-pro-ultra'
      ) {
        replicateInput['image_prompt'] = imageS3Url;
      } else if (model === 'flux-kontext-apps/portrait-series') {
        replicateInput['input_image'] = imageS3Url;
      }
    }

    // Portrait Series model specifics
    if (model === 'flux-kontext-apps/portrait-series') {
      replicateInput['num_images'] = 3;
      if (req.body.background) {
        replicateInput['background'] = req.body.background;
      }
      // Do not send prompt
      delete replicateInput.prompt;
    }

    // Handle expand generation type
    if (isExpandGeneration) {
      replicateInput = {
        image: imageS3Url,
        aspect_ratio: aspectRatio,
        preserve_alpha: true,
        content_moderation: false
      };
    }

    const predictionInput = {
      version: isExpandGeneration ? 'bria/expand-image' : (model || 'black-forest-labs/flux-schnell'),
      input: replicateInput
    };

    console.log('Creating prediction with input:', JSON.stringify(predictionInput, null, 2));
    const prediction = await replicate.predictions.create(predictionInput);
    console.log('Initial prediction created:', JSON.stringify(prediction, null, 2));

    // Wait for the prediction to complete
    let finalPrediction = await replicate.predictions.get(prediction.id);
    console.log('Initial prediction status:', finalPrediction.status);

    while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed') {
      console.log('Waiting for prediction...', {
        status: finalPrediction.status,
        id: prediction.id
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      finalPrediction = await replicate.predictions.get(prediction.id);
    }

    console.log('Final prediction status:', {
      status: finalPrediction.status,
      error: finalPrediction.error,
      output: finalPrediction.output
    });

    if (finalPrediction.status === 'failed') {
      throw new Error(finalPrediction.error || 'Image generation failed');
    }

    // Handle both single URL string and array of URLs
    let validUrls = [];
    if (typeof finalPrediction.output === 'string') {
      validUrls = [finalPrediction.output];
    } else if (Array.isArray(finalPrediction.output)) {
      validUrls = finalPrediction.output;
    } else {
      console.error('Invalid prediction output:', finalPrediction);
      throw new Error('Invalid response format from image generation API');
    }

    // Filter out any non-string or empty values
    validUrls = validUrls.filter(url => {
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

    console.log('Valid image URLs:', validUrls);

    if (validUrls.length === 0) {
      throw new Error('No valid image URLs were generated');
    }

    // Process each image: upload to S3 and save to database
    console.log('=== Starting image processing ===');
    const processedImages = await Promise.all(validUrls.map(async (imageUrl, index) => {
      const timestamp = new Date().getTime();
      const key = `images/${userId}/${timestamp}-${index}.png`;
      const s3Result = await uploadImageToS3(imageUrl, key);
      if (!s3Result.success) {
        console.error('Failed to upload to S3:', s3Result.error);
        return {
          originalUrl: imageUrl,
          s3Url: null,
          error: s3Result.error
        };
      }
      try {
        const result = await db.query(
          'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, aspect_ratio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userId, prompt || 'Image to Image generation', imageUrl, s3Result.s3Url, 
           model === 'bytedance/sdxl-lightning-4step:6f7a773af6fc3e8de9d5a3c00be77c17308914bf67772726aff83496ba1e3bbe' ? '1:1' : (aspectRatio || '3:4')]
        );
        return {
          originalUrl: imageUrl,
          s3Url: s3Result.s3Url,
          id: result.rows[0].id
        };
      } catch (dbError) {
        console.error('Database error:', dbError);
        return {
          originalUrl: imageUrl,
          s3Url: s3Result.s3Url,
          error: 'Failed to save to database'
        };
      }
    }));

    console.log('=== Image processing complete ===');
    console.log('Processed images:', processedImages);
    res.json({ images: processedImages });
  } catch (error) {
    console.error('Error in image generation:', {
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

// Add this before the module.exports
app.get('/api/images', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Images per page
    const offset = (page - 1) * limit;
    const userId = req.query.userId || req.user.id;
    const isPrivate = req.query.isPrivate === 'true';

    // Build the query based on privacy setting
    let query = `
      SELECT id, prompt, image_url, s3_url, aspect_ratio, created_at, is_private
      FROM generated_images
      WHERE user_id = $1
    `;
    const queryParams = [userId];

    if (isPrivate) {
      query += ' AND is_private = true';
    } else {
      query += ' AND is_private = false';
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);
    
    res.json({ images: result.rows });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Error fetching images' });
  }
});

// Public featured gallery endpoint (no auth required)
app.get('/api/featured-gallery', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle, fgi.position
      FROM featured_gallery_images fgi
      JOIN generated_images gi ON fgi.image_id = gi.id
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE fgi.gallery_id = 1
      ORDER BY fgi.position ASC
    `);
    
    res.json({ images: result.rows });
  } catch (error) {
    console.error('Error fetching featured gallery:', error);
    res.status(500).json({ error: 'Error fetching featured gallery' });
  }
});

// Public featured videos endpoint (no auth required)
app.get('/api/featured-videos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT gi.id, gi.prompt, gi.image_url, gi.s3_url, gi.video_url, gi.aspect_ratio, gi.created_at,
             u.x_handle as creator_handle, fvi.position
      FROM featured_videos_items fvi
      JOIN generated_images gi ON fvi.image_id = gi.id
      LEFT JOIN users u ON gi.user_id = u.id
      WHERE fvi.gallery_id = 1 AND gi.video_url IS NOT NULL
      ORDER BY fvi.position ASC
    `);
    
    res.json({ videos: result.rows });
  } catch (error) {
    console.error('Error fetching featured videos:', error);
    res.status(500).json({ error: 'Error fetching featured videos' });
  }
});

// Enhance Image endpoint
app.post('/enhance-image', authMiddleware, async (req, res) => {
  try {
    const { imageBase64, scale = 7, face_enhance = false } = req.body;
    const userId = req.user.id;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API Token is not configured');
    }
    // Upload original image to S3
    const buffer = Buffer.from(imageBase64, 'base64');
    const timestamp = Date.now();
    const origKey = `user-enhance/${userId}/${timestamp}-orig.png`;
    const origS3Result = await uploadImageBufferToS3(buffer, origKey);
    if (!origS3Result.success) {
      return res.status(500).json({ error: 'Failed to upload original image to S3', details: origS3Result.error });
    }
    // Call Replicate model
    const replicateInput = {
      image: `data:image/png;base64,${imageBase64}`,
      scale: Number(scale),
      face_enhance: !!face_enhance
    };
    const predictionInput = {
      version: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
      input: replicateInput
    };
    const prediction = await replicate.predictions.create(predictionInput);
    let finalPrediction = await replicate.predictions.get(prediction.id);
    while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      finalPrediction = await replicate.predictions.get(prediction.id);
    }
    if (finalPrediction.status === 'failed') {
      throw new Error(finalPrediction.error || 'Image enhancement failed');
    }
    let enhancedUrl = Array.isArray(finalPrediction.output) ? finalPrediction.output[0] : finalPrediction.output;
    // Download the original image buffer (already have it as 'buffer')
    // Download the enhanced image buffer
    const enhancedImageResponse = await axios({
      method: 'get',
      url: enhancedUrl,
      responseType: 'arraybuffer',
      timeout: 20000
    });
    const enhancedBuffer = Buffer.from(enhancedImageResponse.data);

    // Get original image dimensions
    const originalMeta = await sharp(buffer).metadata();
    const { width: origWidth, height: origHeight } = originalMeta;

    // Resize/crop the enhanced image to match the original's dimensions
    const resizedEnhancedBuffer = await sharp(enhancedBuffer)
      .resize(origWidth, origHeight, { fit: 'cover' })
      .toBuffer();

    // Upload the resized enhanced image to S3 instead of the raw enhanced image
    const enhKey = `user-enhance/${userId}/${timestamp}-enhanced.png`;
    const enhS3Result = await uploadImageBufferToS3(resizedEnhancedBuffer, enhKey);
    if (!enhS3Result.success) {
      return res.status(500).json({ error: 'Failed to upload enhanced image to S3', details: enhS3Result.error });
    }
    // Save to database (like other generated images)
    const dbResult = await db.query(
      'INSERT INTO generated_images (user_id, prompt, image_url, s3_url, aspect_ratio) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, '[ENHANCE]', enhancedUrl, enhS3Result.s3Url, 'original']
    );
    res.json({
      original: origS3Result.s3Url,
      enhanced: enhS3Result.s3Url,
      db: dbResult.rows[0]
    });
  } catch (error) {
    console.error('Enhance image error:', error);
    res.status(500).json({ error: error.message });
  }
});
