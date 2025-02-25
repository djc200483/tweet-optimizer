require('dotenv').config();  // Move this to very top
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const db = require('./db');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const authMiddleware = require('./middleware/auth');
// const axios = require('axios');  // Commented out for now

// Log database connection info (temporary)
console.log('Database URL configured:', !!process.env.DATABASE_URL);
console.log('Database URL domain:', process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'not found');
console.log('Admin credentials configured:', {
  hasEmail: !!process.env.ADMIN_EMAIL,
  hasPassword: !!process.env.ADMIN_PASSWORD
});

const app = express();

// More permissive CORS configuration
app.use(cors({
  origin: [
    'https://tweet-optimizer.vercel.app',
    'http://localhost:3000',
    'https://tweet-optimizer-production-8f8e.up.railway.app',
    'https://tweet-optimizer-production.up.railway.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());

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
    const { tweet, tone, hook } = req.body;
    
    const hookInstruction = getHookInstruction(hook);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system", 
          "content": `You are a tweet optimization expert who understands the nuances of different communication styles. 
          
IMPORTANT FORMATTING RULES:
- Do NOT include any hashtags (#) in your responses
- Do NOT include any emojis in your responses
- Focus purely on the words and message
- Keep responses concise and Twitter-length
- Use only text characters, no special symbols`
        },
        {
          "role": "user",
          "content": `Rewrite this tweet in a ${tone} tone. ${hookInstruction}\n\nTweet: ${tweet}\n\nRemember: No hashtags or emojis in the response.`
        }
      ],
      n: 3,
    });

    const rewrittenTweets = completion.choices.map(choice => choice.message.content.trim());
    res.json({ rewrittenTweets });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error rewriting tweet' });
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

    const analysis = completion.choices[0].message.content;
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

    const adaptedTweet = completion.choices[0].message.content.trim();
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
    const result = JSON.parse(completion.choices[0].message.content);

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