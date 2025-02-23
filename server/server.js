const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
// const axios = require('axios');  // Commented out for now

dotenv.config();

const app = express();

// More permissive CORS configuration
app.use(cors({
  origin: ['https://tweet-optimizer.vercel.app', 'http://localhost:3000', 'https://tweet-optimizer-production-8f8e.up.railway.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

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
app.post('/rewrite-tweet', async (req, res) => {
  try {
    const { tweet, tone, hook } = req.body;
    
    const hookInstruction = getHookInstruction(hook);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system", 
          "content": `You are a tweet optimization expert who understands the nuances of different communication styles.`
        },
        {
          "role": "user",
          "content": `Rewrite this tweet in a ${tone} tone. ${hookInstruction}\n\nTweet: ${tweet}`
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
app.post('/analyze-tweet', async (req, res) => {
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
Do not use hashtags or emojis.`
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
app.post('/analyze-power-words', async (req, res) => {
  try {
    const { text } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `You are a power word analysis expert. For the given text, provide a detailed analysis in this format:

          1. CURRENT ANALYSIS:
          - List all power words currently used
          - Evaluate their effectiveness
          - Identify missed opportunities

          2. CATEGORY-SPECIFIC ANALYSIS:

          Emotional Impact:
          - Current emotional words used:
          - Missing emotional triggers:
          - Specific improvement suggestions:
          - Example rewrites using emotional power words:

          Urgency and Scarcity:
          - Current urgency words used:
          - Ways to add time pressure:
          - Specific improvement suggestions:
          - Example rewrites with urgency:

          Action-Oriented:
          - Current action words used:
          - Stronger alternatives:
          - Specific improvement suggestions:
          - Example rewrites with action words:

          Social Proof and FOMO:
          - Current social proof elements:
          - Ways to add FOMO:
          - Specific improvement suggestions:
          - Example rewrites with social proof:

          Clarity and Focus:
          - Current clarity words used:
          - Ways to be more direct:
          - Specific improvement suggestions:
          - Example rewrites for clarity:

          Format each section clearly and provide specific, actionable suggestions.`
        },
        {
          "role": "user",
          "content": `Analyze the power words in this text: ${text}`
        }
      ],
    });

    const analysis = completion.choices[0].message.content;
    
    // Define comprehensive suggestion categories
    const suggestions = [
      {
        category: "Emotional Impact",
        words: ["astonishing", "heartwarming", "unbelievable", "jaw-dropping", "life-changing"],
        example: "Transform ordinary moments into jaw-dropping experiences..."
      },
      {
        category: "Urgency and Scarcity",
        words: ["limited-time", "exclusive", "hurry", "last chance", "don't miss out"],
        example: "Last chance: Claim your exclusive spot before it's gone..."
      },
      {
        category: "Action-Oriented",
        words: ["unlock", "transform", "achieve", "discover", "supercharge"],
        example: "Unlock your potential and transform your results..."
      },
      {
        category: "Social Proof & FOMO",
        words: ["join the movement", "trending", "everyone's talking about", "elite"],
        example: "Join the elite community everyone's talking about..."
      },
      {
        category: "Clarity and Focus",
        words: ["clear", "straightforward", "step-by-step", "precise"],
        example: "Your clear, step-by-step guide to mastery..."
      }
    ];

    res.json({ 
      analysis,
      suggestions 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error analyzing power words' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});