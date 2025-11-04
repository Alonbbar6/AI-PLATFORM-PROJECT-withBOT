import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// ============================================
// ENVIRONMENT VARIABLE VALIDATION
// ============================================
const requiredEnvVars = [
  'OPENAI_API_KEY',
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
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
const PORT = process.env.CHATBOT_PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error.message);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Search FAQs using semantic similarity
 */
async function searchFAQs(embedding, matchCount = 3) {
  try {
    const { data, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_count: matchCount,
      match_threshold: 0.5
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error searching FAQs:', error.message);
    throw new Error(`Failed to search FAQs: ${error.message}`);
  }
}

/**
 * Get or create conversation for user
 */
async function getOrCreateConversation(userId) {
  try {
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error getting/creating conversation:', error.message);
    // Fallback: create conversation directly
    const { data, error: insertError } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: 'New Conversation' })
      .select()
      .single();
    
    if (insertError) throw insertError;
    return data.id;
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at, sources')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching conversation history:', error.message);
    return [];
  }
}

/**
 * Save message to database
 */
async function saveMessage(conversationId, role, content, sources = null, embedding = null, tokensUsed = null, responseTime = null) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        sources: sources || [],
        embedding,
        tokens_used: tokensUsed,
        response_time_ms: responseTime
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error saving message:', error.message);
    return null;
  }
}

/**
 * Generate AI response with conversation context
 */
async function generateAIResponse(userMessage, context, conversationHistory = []) {
  try {
    console.log('🤖 Generating AI response with context...');
    
    // Build context string from FAQs
    const contextString = context
      .map((faq, idx) => `[${idx + 1}] Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    // Build conversation history for context
    const historyMessages = conversationHistory.slice(-6).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const systemPrompt = `You are a helpful AI assistant for an AI training platform designed for entrepreneurs and small business owners.

Your role is to:
1. Guide users through the course materials and modules
2. Answer questions about AI concepts in simple, business-friendly language
3. Provide explanations of course content
4. Help users understand how to apply AI to their businesses
5. Maintain conversation context and remember previous questions

Use the following FAQ context and course materials to answer questions:

CONTEXT:
${contextString}

Guidelines:
- Be concise but informative (2-3 paragraphs max)
- Use simple language suitable for business owners
- Reference specific modules when relevant
- If you don't know something, admit it honestly
- Encourage users to explore the platform
- Be enthusiastic about AI and its business applications
- Remember the conversation context and refer back to previous questions when relevant`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = response.choices[0].message.content;
    const tokensUsed = response.usage?.total_tokens || 0;
    
    console.log('✅ AI response generated');
    return { answer, tokensUsed };
  } catch (error) {
    console.error('❌ Error generating AI response:', error.message);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'enhanced-chatbot-api',
    version: '2.0.0',
    features: ['conversation-history', 'context-aware', 'rag-enabled']
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    message: 'AI Training Platform Chatbot API - Enhanced',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      chat: 'POST /api/chat',
      conversations: 'GET /api/conversations/:userId',
      conversationMessages: 'GET /api/conversations/:conversationId/messages',
      deleteConversation: 'DELETE /api/conversations/:conversationId'
    }
  });
});

/**
 * Chat endpoint - Enhanced with conversation history
 */
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, userId, conversationId } = req.body;

    // Validate request
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'UserId is required and must be a string'
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`💬 Processing chat request from user: ${userId}`);
    console.log(`📝 Message: "${message}"`);
    console.log(`${'='.repeat(60)}\n`);

    // Get or create conversation
    const activeConversationId = conversationId || await getOrCreateConversation(userId);
    console.log(`📂 Conversation ID: ${activeConversationId}`);

    // Get conversation history for context
    const conversationHistory = await getConversationHistory(activeConversationId, 10);
    console.log(`📚 Retrieved ${conversationHistory.length} previous messages`);

    // Generate embedding for user's message
    const embedding = await generateEmbedding(message);

    // Search for relevant FAQs
    const relevantFAQs = await searchFAQs(embedding, 3);

    // Generate AI response with context
    const { answer, tokensUsed } = await generateAIResponse(
      message, 
      relevantFAQs, 
      conversationHistory
    );

    // Prepare sources
    const sources = relevantFAQs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
      similarity: faq.similarity,
      category: faq.category || 'general'
    }));

    const responseTime = Date.now() - startTime;

    // Save user message
    await saveMessage(activeConversationId, 'user', message, null, embedding);

    // Save assistant response
    await saveMessage(
      activeConversationId, 
      'assistant', 
      answer, 
      sources, 
      null, 
      tokensUsed, 
      responseTime
    );

    console.log(`\n✅ Request completed in ${responseTime}ms\n`);

    // Return response
    res.json({
      success: true,
      answer,
      sources,
      conversationId: activeConversationId,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      metadata: {
        userId,
        sourcesFound: sources.length,
        tokensUsed,
        historyLength: conversationHistory.length
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

/**
 * Get user's conversations
 */
app.get('/api/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, is_active')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      conversations: data || []
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

/**
 * Get messages for a conversation
 */
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await getConversationHistory(conversationId, 100);

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

/**
 * Delete a conversation
 */
app.delete('/api/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  console.log(`⚠️  404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

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
  console.log('🚀 ENHANCED CHATBOT API SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Local:    http://localhost:${PORT}`);
  console.log(`🏥 Health:   http://localhost:${PORT}/health`);
  console.log(`💬 Chat:     POST http://localhost:${PORT}/api/chat`);
  console.log('='.repeat(60));
  console.log('\n✨ Features:');
  console.log('  ✅ Conversation history & context');
  console.log('  ✅ RAG with FAQ embeddings');
  console.log('  ✅ Multi-user support');
  console.log('  ✅ Message persistence');
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
