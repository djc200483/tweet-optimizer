// Niche Categories and their subcategories
const nicheCategories = {
  "Personal Development": [
    "Mindfulness & Meditation",
    "Habit Building",
    "Time Management",
    "Productivity Hacks",
    "Overcoming Procrastination",
    "Goal Setting",
    "Mental Health & Well-being",
    "Positive Psychology",
    "Emotional Intelligence",
    "Stress Management"
  ],
  "Health & Wellness": [
    "Nutrition & Dieting",
    "Weight Loss Tips",
    "Healthy Recipes",
    "Fitness Routines",
    "Home Workouts",
    "Yoga & Flexibility",
    "Mental Health in Fitness",
    "Sleep & Recovery",
    "Supplements and Vitamins",
    "Healthy Aging"
  ],
  "Fitness & Strength Training": [
    "Strength Training for Beginners",
    "Bodyweight Workouts",
    "Weightlifting Techniques",
    "Powerlifting Tips",
    "Endurance Training",
    "Flexibility & Mobility",
    "CrossFit Workouts",
    "HIIT (High-Intensity Interval Training)",
    "Athletic Performance",
    "Post-Workout Recovery"
  ],
  "Personal Finance": [
    "Budgeting & Saving Money",
    "Investing Tips",
    "Financial Independence & Early Retirement (FIRE)",
    "Debt Management",
    "Stock Market Insights",
    "Cryptocurrency",
    "Real Estate Investments",
    "Retirement Planning",
    "Passive Income Streams",
    "Money Mindset"
  ],
  "Career Development": [
    "Job Search & Interview Tips",
    "Building a Personal Brand",
    "Networking Strategies",
    "Resume & Cover Letter Advice",
    "Remote Work & Freelancing",
    "Professional Growth & Development",
    "Leadership & Management",
    "Career Change Tips",
    "Work-Life Balance",
    "Entrepreneurship"
  ],
  "Business & Entrepreneurship": [
    "Startup Strategies",
    "Business Marketing",
    "Sales Techniques",
    "Customer Relationship Management",
    "Business Productivity Tools",
    "E-commerce & Online Business",
    "Leadership in Business",
    "Innovation & Creativity",
    "Business Scaling Tips",
    "Outsourcing & Delegation"
  ],
  "Technology & Innovation": [
    "Artificial Intelligence (AI)",
    "Machine Learning & Data Science",
    "Blockchain & Cryptocurrency",
    "Cloud Computing",
    "Robotics & Automation",
    "Augmented Reality (AR) & Virtual Reality (VR)",
    "Internet of Things (IoT)",
    "Cybersecurity",
    "Software Development & Coding",
    "Tech Startups"
  ],
  "Digital Marketing": [
    "Social Media Strategy",
    "Content Marketing",
    "SEO (Search Engine Optimization)",
    "SEM (Search Engine Marketing)",
    "Affiliate Marketing",
    "Email Marketing",
    "Influencer Marketing",
    "Paid Ads & PPC Campaigns",
    "Brand Building",
    "Web Analytics"
  ],
  "Lifestyle": [
    "Minimalism & Simple Living",
    "Sustainable Living",
    "Travel & Adventure",
    "Luxury Lifestyle",
    "Tiny Homes & Off-the-Grid Living",
    "Hobbies & Interests",
    "Digital Nomad Lifestyle",
    "Self-Care Routines",
    "Time Freedom",
    "Family Life & Parenting"
  ],
  "Relationships & Dating": [
    "Healthy Relationships",
    "Communication Skills",
    "Conflict Resolution",
    "Dating Advice",
    "Marriage & Long-Term Relationships",
    "Friendships & Social Skills",
    "Family Dynamics",
    "Dating in the Modern World",
    "Online Dating Tips",
    "Building Trust & Intimacy"
  ],
  "Food & Cooking": [
    "Quick & Easy Recipes",
    "Meal Prep Ideas",
    "Vegan & Plant-Based Cooking",
    "Baking & Desserts",
    "International Cuisine",
    "Cooking for Special Diets (Keto, Paleo, etc.)",
    "Healthy Cooking Hacks",
    "Gourmet Cooking Tips",
    "Cooking for Beginners",
    "Food Pairing & Flavor Combinations"
  ],
  "Arts & Creativity": [
    "Painting & Drawing",
    "Photography Tips",
    "Graphic Design & Digital Art",
    "DIY Projects & Crafts",
    "Writing & Storytelling",
    "Poetry",
    "Fashion Design",
    "Music Production",
    "Dance",
    "Creative Hobbies for Relaxation"
  ],
  "Education & Learning": [
    "Study Tips & Hacks",
    "Learning New Languages",
    "Online Courses & Certifications",
    "Lifelong Learning",
    "Reading & Book Recommendations",
    "Memory & Retention",
    "Science & Technology Education",
    "Online Learning Platforms",
    "Self-Teaching Techniques",
    "Student Success Tips"
  ],
  "History & Culture": [
    "Ancient Civilizations",
    "World Wars & Conflicts",
    "Cultural Heritage",
    "Historical Mysteries",
    "Famous Figures in History",
    "World Leaders",
    "Evolution of Societies",
    "Archaeological Discoveries",
    "History of Art",
    "Folklore & Legends"
  ],
  "Entertainment & Media": [
    "Movie & TV Reviews",
    "Celebrity News & Gossip",
    "Music & Album Reviews",
    "Gaming Insights & Reviews",
    "Pop Culture Trends",
    "Book Reviews & Recommendations",
    "Comic Books & Graphic Novels",
    "Reality TV",
    "Documentaries & Docuseries",
    "Live Performances & Concerts"
  ],
  "Environment & Sustainability": [
    "Climate Change Awareness",
    "Renewable Energy",
    "Green Technologies",
    "Waste Reduction",
    "Conservation Efforts",
    "Environmental Activism",
    "Wildlife Protection",
    "Eco-Friendly Products",
    "Sustainability in Business",
    "Green Urban Planning"
  ],
  "Social Issues & Advocacy": [
    "Gender Equality",
    "Racial Equality & Justice",
    "LGBTQ+ Rights",
    "Mental Health Awareness",
    "Poverty & Homelessness",
    "Refugee & Immigration Rights",
    "Education for All",
    "Disability Rights & Advocacy",
    "Animal Rights",
    "Climate Justice"
  ],
  "Spirituality & Religion": [
    "Meditation & Mindfulness Practices",
    "Yoga Philosophy",
    "Religious Teachings",
    "Exploring Faiths & Beliefs",
    "Spiritual Growth & Enlightenment",
    "Buddhism & Eastern Practices",
    "Christianity & Biblical Insights",
    "Hinduism & Vedic Teachings",
    "New Age Spirituality",
    "Mysticism & Occultism"
  ],
  "Travel & Adventure": [
    "Adventure Travel Guides",
    "Backpacking & Hiking",
    "Travel Hacks & Tips",
    "Luxury Travel",
    "Solo Travel Experiences",
    "Budget Travel Tips",
    "Travel Blogging & Photography",
    "Exploring New Destinations",
    "Cultural Travel Experiences",
    "Sustainable Travel"
  ],
  "Science & Nature": [
    "Space Exploration",
    "Earth Sciences",
    "Marine Biology",
    "Environmental Science",
    "Animal Behavior",
    "Genetics & Evolution",
    "Astronomy & Astrophysics",
    "Climate Science",
    "Scientific Discoveries & Breakthroughs",
    "Human Anatomy & Physiology"
  ],
  "Sports & Recreation": [
    "Basketball Tips & Techniques",
    "Soccer / Football Coaching",
    "Tennis Tips",
    "Golfing Techniques",
    "Sports Psychology",
    "Extreme Sports",
    "Olympic Sports",
    "Fantasy Sports",
    "Outdoor Activities & Recreation",
    "Adventure Racing & Triathlons"
  ],
  "Parenting & Family": [
    "Child Development",
    "Positive Parenting",
    "Parenting Teenagers",
    "Single Parenting",
    "Family Time Activities",
    "Education at Home",
    "Work-Life Balance for Parents",
    "Parenting Hacks & Tips",
    "Family Health & Well-being",
    "Raising Independent Children"
  ],
  "Technology & Gadgets": [
    "Tech Product Reviews",
    "Gadgets & Wearables",
    "Smartphone Tips & Tricks",
    "Home Automation",
    "Smart Home Devices",
    "New Tech Innovations",
    "Virtual Assistants",
    "Gaming Consoles & PCs",
    "3D Printing",
    "Augmented & Virtual Reality Devices"
  ],
  "Self-Improvement": [
    "Growth Mindset",
    "Confidence Building",
    "Self-Discipline",
    "Overcoming Fear",
    "Personal Transformation Stories",
    "Public Speaking & Presentation Skills",
    "Visualization Techniques",
    "Breaking Bad Habits",
    "Forgiveness & Letting Go",
    "Overcoming Adversity"
  ],
  "Financial Freedom": [
    "Passive Income Ideas",
    "Money Mindset & Wealth Building",
    "Investments for Beginners",
    "Building Financial Security",
    "Real Estate for Beginners",
    "Side Hustles & Freelancing",
    "Financial Freedom Stories",
    "Credit Management & Debt",
    "Planning for Early Retirement",
    "Financial Independence & FIRE Movement"
  ],
  "Relationships & Communication": [
    "Conflict Resolution",
    "Non-Violent Communication",
    "Strengthening Bonds",
    "Empathy in Relationships",
    "Active Listening",
    "Compassionate Communication",
    "Navigating Modern Dating",
    "Relationship Red Flags",
    "Couples Counseling",
    "Digital Detox & Communication"
  ]
};

// Hook templates
const hookTemplates = [
  "The secret to [X] is simpler than you think.",
  "Stop doing [X] if you want [Y].",
  "What if I told you that [X] can completely change [Y]?",
  "Most people are getting [X] all wrong—here's why.",
  "You won't believe how easy it is to [X].",
  "The one thing you need to stop doing if you want to [X].",
  "Here's why you should never [X] again.",
  "Want to know the key to [X]? It's simpler than you think.",
  "The truth about [X] that no one is talking about.",
  "What most people don't realize about [X] is [Y].",
  "If you're not [doing X], you're missing out on [Y].",
  "Here's the mistake everyone makes when trying to [X].",
  "If you want [X], stop doing [Y].",
  "Why you should start [X] today.",
  "Have you ever wondered why [X] happens?",
  "This is why [X] is not as hard as everyone says.",
  "The #1 thing I wish I knew before [X].",
  "The shocking truth behind [X].",
  "What they don't tell you about [X]—and why it matters.",
  "Is it time for you to [X]? Here's how to know.",
  "Here's the one thing I learned from [X] that changed everything.",
  "Why [X] is the real game-changer you've been waiting for.",
  "The only thing you need to focus on if you want to [X].",
  "It's time to stop believing [X] about [Y].",
  "The truth about [X] that no one else will tell you.",
  "I did [X] for [Y] days and here's what happened.",
  "You're wasting time on [X]—here's what you should be doing instead.",
  "This one thing will make [X] so much easier.",
  "Everyone is talking about [X], but here's what they're missing.",
  "What's really stopping you from [X]—and how to fix it.",
  "The biggest mistake you can make when trying to [X].",
  "If you want [X], here's the real trick.",
  "You might be doing [X] all wrong—here's the right way.",
  "Ever wondered why [X] is so hard? Here's why it's easier than you think.",
  "The best-kept secret for [X] that everyone forgets.",
  "The 3 things you need to know before you start [X].",
  "If you're struggling with [X], here's what to try instead.",
  "Here's why no one talks about [X]—and why that needs to change.",
  "What I learned after [X] years of doing [Y].",
  "If you're not [X], you're missing out on [Y].",
  "What to do when [X] happens.",
  "The one thing you should never overlook when trying to [X].",
  "Why you shouldn't give up on [X] just yet.",
  "Want to level up in [X]? Do this first.",
  "You're doing [X] wrong—here's the correct way.",
  "What if [X] didn't have to be this hard?",
  "How to easily [X] without wasting time or money.",
  "This simple trick can make all the difference in [X].",
  "Why [X] is easier than you think—if you know how.",
  "What successful people do differently when it comes to [X].",
  "Don't make this common mistake when you're [X].",
  "The one habit that will help you master [X].",
  "Why [X] is the key to [Y], and here's how to start.",
  "The truth is [X] might not be enough—here's how to take it to the next level.",
  "You won't believe how easy it is to [X] once you know this.",
  "Here's the easiest way to [X]—and you've probably been missing it.",
  "How [X] can help you achieve [Y] without feeling overwhelmed.",
  "If you want [X], this is the only thing that works.",
  "The one thing I wish someone told me before I [X].",
  "This is why most people fail at [X]—and how you can succeed.",
  "You don't need to be an expert to [X], but you do need to [Y].",
  "How I went from [X] to [Y] in [Z] steps.",
  "What no one tells you about starting [X].",
  "How to avoid the common trap of [X].",
  "Why you should never settle for [X] when you can [Y].",
  "If you want to achieve [X], you have to stop doing [Y].",
  "Don't let [X] stop you from [Y]—here's what to do.",
  "Here's how to [X] in less than 5 minutes a day.",
  "You're closer to [X] than you think—here's why.",
  "The best advice I ever got about [X] was [Y].",
  "Want to know what [X] really takes? Here's the truth.",
  "I'm going to show you how to [X] in just [Y] days.",
  "How to turn your [X] into a success story.",
  "Everything you need to know about [X] in one post.",
  "Why you're missing out on [X], and what you can do about it.",
  "The one decision that will change your [X] forever.",
  "Here's why your current strategy for [X] is failing.",
  "The power of [X]—and how it can transform your life.",
  "How to stop wasting time on [X] and finally [Y].",
  "Why [X] is a waste of time unless you're doing this."
];

// Post formats
const postFormats = [
  "A Question Post",
  "A Tip Post",
  "A Myth-Busting Post",
  // ... Add all other format types
];

// Content length configurations
const contentLengths = {
  "short": 150,
  "medium": 400,
  "long": 3000
};

module.exports = {
  nicheCategories,
  hookTemplates,
  postFormats,
  contentLengths
}; 