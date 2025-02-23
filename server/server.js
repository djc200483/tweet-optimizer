const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
// const axios = require('axios');  // Commented out for now

dotenv.config();

const app = express();

// Remove all previous CORS configurations and use this single one
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://tweet-optimizer.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
          "content": `You are a tweet optimization expert who understands the nuances of different communication styles. Here are the distinct styles and their characteristics:

// Professional & Business
Professional: Clear, polished, industry-standard language, maintains credibility
Corporate: Formal, business-oriented, structured, authoritative
Sales: Action-oriented, value-focused, compelling, drives conversion
Persuasive: Convincing, strategic, outcome-focused, influences decisions

// Casual & Personal
Casual: Relaxed, friendly, approachable, everyday language
Conversational: Natural, dialogue-like, engaging, relatable
Authentic: Genuine, personal, honest, true to voice
Heartfelt: Emotional, sincere, compassionate, connects deeply

// Entertainment & Humor
Humorous: Funny, light-hearted, entertaining, brings joy
Witty: Clever, sharp, intelligent humor, quick thinking
Playful: Fun, cheerful, lighthearted, brings delight
Sarcastic: Ironic, satirical, clever criticism, edgy

// Educational & Informative
Educational: Teaching-focused, informative, clear explanation
Informative: Fact-based, detailed, enlightening, shares knowledge
Analytical: Data-driven, logical, methodical, evidence-based
Technical: Specialized, precise, detailed, expert-level

// Inspirational & Motivational
Inspirational: Uplifting, motivating, positive, sparks imagination
Motivational: Encouraging, action-driving, energetic, builds momentum
Empowering: Confidence-building, strengthening, enables growth
Encouraging: Supportive, positive, reassuring, nurtures progress

Important Guidelines:
1. When given a specific tone, create three DISTINCTLY DIFFERENT variations using ONLY that tone's characteristics.
2. Do not mix tones or borrow from related tones.
3. Each variation should:
   - Use a unique opening/hook approach
   - Vary in sentence structure and word choice
   - Maintain the core message but express it differently
   - Feel fresh and distinct from the other versions

${hook === 'curiosity' ? `For curiosity hooks, use different approaches for each version:
- Version 1: Use a "What if..." or "Imagine..." opening
- Version 2: Create mystery with "The secret behind..." or "Here's what most people miss..."
- Version 3: Challenge assumptions with "Think you know about...? Think again"` : ''}

${hook === 'controversial' ? `For controversial hooks, vary the intensity and approach:
- Version 1: Start with "Unpopular opinion:" and a bold statement
- Version 2: Challenge conventional wisdom with "Everyone says... but here's the truth:"
- Version 3: Use a "Stop believing this myth:" approach` : ''}

${hook === 'number' ? `For number hooks, use different numerical approaches:
- Version 1: Use a smaller number (2-3) with "crucial" or "essential"
- Version 2: Use a medium number (4-5) with "surprising" or "unexpected"
- Version 3: Use a specific number with "secrets" or "strategies"` : ''}

${hook === 'shock' ? `For shock hooks, vary the surprise element:
- Version 1: Use a surprising statistic or fact
- Version 2: Present a counter-intuitive truth
- Version 3: Start with a dramatic revelation` : ''}

${hook === 'relatable' ? `For relatable hooks, use different emotional angles:
- Version 1: Use "We've all been there..." approach
- Version 2: Start with "That moment when..."
- Version 3: Begin with "Let's be honest..." or "Truth time:"` : ''}

Number your responses 1., 2., and 3.
Avoid hashtags and emojis.
Ensure each version feels completely different from the others.`
        },
        {
          "role": "user", 
          "content": `Create exactly three variations of this message using strictly the ${tone} tone ONLY: ${tweet}`
        }
      ],
    });
    
    // Split the response into an array of tweets
    const versions = completion.choices[0].message.content
      .split('\n')
      .filter(line => line.trim().length > 0 && /^\d\./.test(line))
      .map(line => line.replace(/^\d\.\s*/, '').trim());

    res.json({ rewrittenTweets: versions });
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
          "content": `You are a tweet analysis expert. Analyze tweets for their viral potential and structure.
          Break down the following elements in a clear, concise way:
          
          1. Hook Type: Identify the opening hook style (question, statement, curiosity, etc.)
          2. Engagement Triggers: Identify emotional or psychological triggers used
          3. Structure & Style: Analyze the writing style and format
          4. Key Success Elements: Identify what makes this tweet potentially engaging
          5. Target Response: What reaction was the tweet designed to elicit
          
          Keep each analysis point brief but insightful. Total response should be under 350 characters per section.
          Format the response as a JSON array with 'label' and 'value' for each element.`
        },
        {
          "role": "user",
          "content": `Analyze this tweet: ${tweet}`
        }
      ],
    });

    // Parse the response into structured format
    const analysis = JSON.parse(completion.choices[0].message.content);
    
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
    
    // First, get a detailed analysis of the tweet
    const analysisCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `Analyze this tweet's emotional and structural elements in detail. Focus on:
1. The core emotion or message being conveyed
2. The writing style and tone being used
3. The intended impact on readers
4. Any unique phrases or word choices
5. Areas where stronger word choices could enhance impact

Provide a thorough but concise analysis.`
        },
        {
          "role": "user",
          "content": `Analyze this tweet: ${text}`
        }
      ],
    });

    const analysis = analysisCompletion.choices[0].message.content;

    // Use the analysis to generate power word suggestions in specific categories
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": `You are a power words expert. Based on this analysis of a tweet, suggest powerful words that would enhance its specific message and impact.

Analysis of the tweet:
${analysis}

You MUST provide suggestions for ALL of these categories, adapting them to fit the tweet's context:

1. Emotional Impact Words:
- Words that trigger specific emotions (joy, curiosity, excitement, empathy, fear)
- Examples: astonishing, heartwarming, unbelievable, jaw-dropping, life-changing
- Adapt emotional words to match or amplify the tweet's current emotional tone

2. Urgency and Scarcity Words:
- Words that create time pressure or scarcity
- Examples: limited-time, last chance, exclusive, don't miss out
- If the tweet isn't time-sensitive, suggest ways to add gentle urgency

3. Action-Oriented Words:
- Words that drive motivation and empowerment
- Examples: unlock, transform, achieve, supercharge, revolutionize
- Even for informational tweets, suggest action words that enhance engagement

4. Social Proof and FOMO Words:
- Words that suggest widespread engagement or exclusivity
- Examples: join the movement, everyone's talking about, be part of the elite
- For personal tweets, adapt these to create community connection

5. Clarity and Focus Words:
- Words that provide clear direction and understanding
- Examples: clear, straightforward, step-by-step, precise, definitive
- For every tweet style, suggest ways to enhance clarity while maintaining tone

For EACH category (all must be included):
- Provide 3-5 words that could enhance the tweet
- Show an example of how to integrate these words naturally
- If a category seems less relevant, be creative in adapting it to fit
- Maintain the tweet's authentic voice while making it more impactful

Format response as a JSON object with:
{
  "tone": "Analysis of current emotional tone",
  "structure": "Analysis of writing style and structure",
  "improvements": "Specific opportunities for stronger word choices",
  "suggestions": [
    {
      "category": "Category name (must include all 5 categories)",
      "words": ["word1", "word2", "word3"],
      "example": "Example using these words in THIS tweet"
    }
  ]
}`
        },
        {
          "role": "user",
          "content": `Suggest power words for this tweet: ${text}`
        }
      ],
    });

    const powerWords = JSON.parse(completion.choices[0].message.content);
    res.json(powerWords);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error analyzing power words' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});