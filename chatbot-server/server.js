import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('🔍 Validating environment variables...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Please check your .env file');
  process.exit(1);
}

console.log('✅ All required environment variables are set\n');

// ============================================
// INITIALIZE CLIENTS
// ============================================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Determine which mode to use
const USE_LOCAL_OPENAI = process.env.USE_LOCAL_OPENAI === 'true';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_Test || process.env.N8N_WEBHOOK_URL;

// Initialize OpenAI client if using local mode
let openai = null;
if (USE_LOCAL_OPENAI) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('❌ OPENAI_API_KEY not configured. Please set it in .env file');
    console.error('💡 Get your API key from: https://platform.openai.com/api-keys');
    process.exit(1);
  }
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('🤖 Mode: LOCAL OPENAI');
} else {
  if (!N8N_WEBHOOK_URL) {
    console.error('❌ No webhook URL configured. Please set N8N_WEBHOOK_URL_Test or N8N_WEBHOOK_URL in .env');
    process.exit(1);
  }
  console.log('🔗 Using webhook URL:', N8N_WEBHOOK_URL);
  console.log('📍 Mode: N8N', process.env.N8N_WEBHOOK_URL_Test ? '(TEST)' : '(PRODUCTION)');
}

// ============================================
// CONVERSATION MEMORY STORAGE
// ============================================
// Store conversation history in memory (for production, use a database)
const conversationHistory = new Map();

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
const PORT = process.env.CHATBOT_PORT || 3001;

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate embedding for a text using OpenAI
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    console.log('🔄 Generating embedding for text:', text.substring(0, 100) + '...');
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    console.log('✅ Embedding generated successfully');
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Search FAQs using semantic similarity
 * @param {number[]} embedding - The query embedding
 * @param {number} matchCount - Number of results to return
 * @returns {Promise<Array>} - Matching FAQs with similarity scores
 */
async function searchFAQs(embedding, matchCount = 3) {
  try {
    console.log('🔍 Searching FAQs with semantic similarity...');
    
    const { data, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_count: matchCount,
      match_threshold: 0.5
    });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} matching FAQs`);
    return data || [];
  } catch (error) {
    console.error('❌ Error searching FAQs:', error.message);
    throw new Error(`Failed to search FAQs: ${error.message}`);
  }
}

/**
 * Generate AI response by forwarding to n8n webhook
 * @param {string} userMessage - The user's question
 * @param {Array} context - Relevant FAQ context
 * @param {string} userId - User ID for conversation tracking
 * @param {Array} conversationMessages - Previous conversation messages
 * @returns {Promise<string>} - AI-generated response from n8n
 */
async function generateAIResponse(userMessage, context, userId, conversationMessages = []) {
  try {
    // System prompt for the AI
    const systemPrompt = `You are an AI Training Platform Assistant helping entrepreneurs and small business owners.

YOUR ROLE:
- Answer questions about AI training courses and modules
- Help users navigate through the platform
- Provide guidance on using AI tools for business
- Offer Spanish translations when requested
- Be friendly, professional, and concise

IMPORTANT RULES:
- Always stay in character as a helpful assistant
- Give practical, actionable advice
- When users introduce themselves, greet them warmly and remember their name
- Keep responses focused and relevant to AI training
- Provide step-by-step navigation instructions when asked
- Don't tell stories or go off-topic

Remember: You're here to help users learn about AI for their business!`;

    // Use local OpenAI if enabled
    if (USE_LOCAL_OPENAI) {
      console.log('🤖 Using local OpenAI...');
      
      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history
      for (const msg of conversationMessages.slice(-10)) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      const aiResponse = completion.choices[0].message.content;
      console.log('✅ Received response from OpenAI');
      return aiResponse;
      
    } else {
      // Use n8n webhook
      console.log('🤖 Forwarding request to n8n webhook...');
      
      const systemContext = {
        role: "AI Training Platform Assistant",
        capabilities: [
          "Answer questions about AI training courses and modules",
          "Navigate users through the platform features",
          "Provide Spanish translations when requested"
        ],
        platformFeatures: [
          "Interactive AI training modules",
          "Hands-on exercises and projects",
          "Progress tracking and certificates"
        ],
        instructions: [
          "Be helpful, friendly, and professional",
          "Use simple language suitable for business owners",
          "Provide specific navigation instructions when asked"
        ]
      };
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          systemContext,
          conversationHistory: conversationMessages,
          userId,
          context: context.map(faq => ({
            question: faq.question,
            answer: faq.answer,
            similarity: faq.similarity
          }))
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`n8n webhook responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 n8n response:', JSON.stringify(data, null, 2));
      
      const aiResponse = data.response || data.message || data.output || data.text || JSON.stringify(data);
      
      if (!aiResponse) {
        throw new Error('No response received from n8n workflow');
      }

      console.log('✅ Received response from n8n');
      return aiResponse;
    }
    
  } catch (error) {
    console.error('❌ Error generating AI response:', error.message);
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'chatbot-api',
    version: '1.0.0'
  });
});

/**
 * Root endpoint
 * GET /
 */
app.get('/', (req, res) => {
  res.json({
    message: 'AI Training Platform Chatbot API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/chat'
    }
  });
});

/**
 * Chat endpoint - Main chatbot functionality
 * POST /api/chat
 * Body: { message: string, userId: string }
 */
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const { message, userId } = req.body;

    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid request: missing or invalid message');
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    if (!userId || typeof userId !== 'string') {
      console.log('❌ Invalid request: missing or invalid userId');
      return res.status(400).json({
        success: false,
        error: 'UserId is required and must be a string'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`💬 Processing chat request from user: ${userId}`);
    console.log(`📝 Message: "${message}"`);
    console.log(`${'='.repeat(60)}\n`);

    // Get or create conversation history for this user
    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const userConversation = conversationHistory.get(userId);
    
    // Add user message to history
    userConversation.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 messages to avoid token limits
    if (userConversation.length > 20) {
      userConversation.splice(0, userConversation.length - 20);
    }

    // Forward to n8n with conversation history
    const answer = await generateAIResponse(message, [], userId, userConversation);

    // Add assistant response to history
    userConversation.push({
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString()
    });

    // No sources since we're using n8n directly
    const sources = [];

    const responseTime = Date.now() - startTime;
    console.log(`\n✅ Request completed in ${responseTime}ms\n`);

    // Return successful response
    res.json({
      success: true,
      answer,
      sources,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      metadata: {
        userId,
        sourcesFound: sources.length
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`\n❌ Error processing request (${responseTime}ms):`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  console.log(`⚠️  404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CHATBOT API SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Local:    http://localhost:${PORT}`);
  console.log(`🏥 Health:   http://localhost:${PORT}/health`);
  console.log(`💬 Chat:     POST http://localhost:${PORT}/api/chat`);
  console.log('='.repeat(60) + '\n');
  console.log('📝 Waiting for requests...\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  process.exit(0);
});
