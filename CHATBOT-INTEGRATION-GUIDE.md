# 🤖 ChatGPT-Powered AI Chatbot Integration Guide

Complete guide for implementing a production-ready AI chatbot with n8n middleware, conversation history, and course material understanding.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Frontend Integration](#frontend-integration)
5. [n8n Workflow Configuration](#n8n-workflow-configuration)
6. [Database Schema](#database-schema)
7. [Advanced Features](#advanced-features)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### What You're Building

A comprehensive AI chatbot system that:
- ✅ **Guides users** through course materials
- ✅ **Answers questions** using RAG (Retrieval Augmented Generation)
- ✅ **Maintains context** across conversations
- ✅ **Stores history** in Supabase PostgreSQL
- ✅ **Scales** with n8n orchestration
- ✅ **Understands** course content via embeddings

### Tech Stack

**Frontend:**
- Next.js 16 + React 19
- TailwindCSS for styling
- Lucide React for icons

**Backend:**
- Express.js API server
- OpenAI GPT-4o-mini
- OpenAI Embeddings (text-embedding-3-small)

**Database:**
- Supabase (PostgreSQL + pgvector)
- Vector similarity search
- Row-level security

**Middleware:**
- n8n Cloud (https://aiforepic.app.n8n.cloud)
- Webhook orchestration
- Error handling & retry logic

---

## 🏗️ Architecture

```
┌─────────────┐
│   User UI   │
│  (Next.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  n8n Cloud  │  ← Webhook: /webhook/chatbot-webhook
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Express API │  ← Enhanced server with conversation mgmt
│   Server    │
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│   OpenAI    │  │  Supabase   │
│   API       │  │  Database   │
└─────────────┘  └─────────────┘
```

### Data Flow

1. **User sends message** → ChatbotWidget component
2. **Widget calls n8n** → POST to webhook
3. **n8n forwards** → Express API server
4. **API processes:**
   - Gets/creates conversation
   - Retrieves conversation history
   - Generates embedding for message
   - Searches FAQs + course materials
   - Calls GPT-4o-mini with context
   - Saves message to database
5. **Response flows back** → n8n → Widget → User

---

## 🚀 Setup Instructions

### Step 1: Database Setup

Run the migration to create conversation tables:

```bash
cd /Users/user/Desktop/teams\ ai\ project/AI-PLATFORM-PROJECT

# Apply migration
psql $DATABASE_URL -f migrations/003_create_chat_tables.sql

# Or use Supabase dashboard:
# 1. Go to SQL Editor
# 2. Paste contents of migrations/003_create_chat_tables.sql
# 3. Run query
```

### Step 2: Generate Course Embeddings

```bash
# Generate embeddings for course materials
node scripts/generate-course-embeddings.js

# This creates embeddings for:
# - Module 1: Introduction to AI
# - Module 2: AI Tools and Technologies
# - Module 3: Advanced AI Applications
```

### Step 3: Configure Environment Variables

Update your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# n8n Configuration
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
CHATBOT_PORT=3001
```

### Step 4: Start Enhanced Server

```bash
cd chatbot-server

# Install dependencies (if not already done)
npm install

# Start enhanced server with conversation management
node enhanced-server.js
```

Expected output:
```
🚀 ENHANCED CHATBOT API SERVER STARTED
📍 Local:    http://localhost:3001
🏥 Health:   http://localhost:3001/health
💬 Chat:     POST http://localhost:3001/api/chat

✨ Features:
  ✅ Conversation history & context
  ✅ RAG with FAQ embeddings
  ✅ Multi-user support
  ✅ Message persistence
```

### Step 5: Configure n8n Workflow

#### Option A: Import JSON (Recommended)

1. Go to n8n dashboard: https://aiforepic.app.n8n.cloud
2. Click **Workflows** → **Import from File**
3. Select: `n8n-workflows/chatbot-workflow-enhanced.json`
4. Update the HTTP Request node URL:
   - For local dev: Use ngrok URL
   - For production: Use your deployed API URL
5. **Activate** the workflow

#### Option B: Manual Setup

See [n8n Workflow Configuration](#n8n-workflow-configuration) section below.

### Step 6: Add Chatbot to Your App

Edit your layout or page file:

```tsx
// app/layout.tsx or app/dashboard/layout.tsx
import ChatbotWidget from './components/ChatbotWidget';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Add chatbot widget */}
        <ChatbotWidget 
          userId="user-123"  // Replace with actual user ID
          position="bottom-right"
          primaryColor="#3B82F6"
        />
      </body>
    </html>
  );
}
```

---

## 💻 Frontend Integration

### ChatbotWidget Component

The widget is already created at `app/components/ChatbotWidget.tsx`.

**Features:**
- ✅ Floating chat button
- ✅ Expandable/collapsible interface
- ✅ Message history display
- ✅ Source citations
- ✅ Typing indicators
- ✅ Error handling
- ✅ Conversation clearing

**Props:**

```typescript
interface ChatbotWidgetProps {
  userId?: string;           // User identifier (default: 'guest-user')
  position?: 'bottom-right' | 'bottom-left';  // Widget position
  primaryColor?: string;     // Brand color (default: '#3B82F6')
}
```

**Usage Examples:**

```tsx
// Basic usage
<ChatbotWidget />

// With user ID
<ChatbotWidget userId={session.user.id} />

// Custom styling
<ChatbotWidget 
  userId="user-456"
  position="bottom-left"
  primaryColor="#10B981"
/>
```

### API Service Layer

Use the `chatbot-api.ts` service for programmatic access:

```typescript
import { chatbotAPI } from '@/lib/chatbot-api';

// Send a message
const response = await chatbotAPI.sendMessage({
  message: "What is Module 1 about?",
  userId: "user-123"
});

// Get conversation history
const conversations = await chatbotAPI.getConversationHistory("user-123");

// Search conversations
const results = await chatbotAPI.searchConversations("AI tools", "user-123");
```

---

## 🔄 n8n Workflow Configuration

### Workflow Nodes

Your n8n workflow has **6 nodes**:

1. **Webhook** - Receives POST requests
2. **Call Chatbot API** - Forwards to Express server
3. **Check Success** - Validates response
4. **Format Success Response** - Structures successful responses
5. **Format Error Response** - Handles errors gracefully
6. **Return Response** - Sends response back to client

### Node Configuration Details

#### 1. Webhook Node

```
HTTP Method: POST
Path: chatbot-webhook
Response Mode: When Last Node Finishes
```

**Production URL:**
```
https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

**Test URL:**
```
https://aiforepic.app.n8n.cloud/webhook-test/chatbot-webhook
```

#### 2. HTTP Request Node

```
Method: POST
URL: {{ $env.CHATBOT_API_URL || 'http://localhost:3001' }}/api/chat
Authentication: None
Send Body: Yes
Body Content Type: JSON
```

**JSON Body:**
```json
{
  "message": "{{ $json.body.message || $json.message }}",
  "userId": "{{ $json.body.userId || $json.userId || 'guest-user' }}",
  "conversationId": "{{ $json.body.conversationId || $json.conversationId || null }}"
}
```

**Options:**
- Timeout: 30000ms
- Retry: Enabled (2 retries, 1s wait)

#### 3-6. Response Formatting Nodes

These nodes ensure consistent response format regardless of success/failure.

### Environment Variables in n8n

Set in n8n Settings → Variables:

```
CHATBOT_API_URL=https://your-api-domain.com
```

Or use ngrok for local development:
```
CHATBOT_API_URL=https://abc123.ngrok-free.app
```

---

## 🗄️ Database Schema

### Tables Created

#### 1. `conversations`
Stores conversation sessions.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB
);
```

#### 2. `messages`
Stores individual messages with embeddings.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP,
    sources JSONB,
    embedding vector(1536),
    tokens_used INTEGER,
    response_time_ms INTEGER,
    metadata JSONB
);
```

#### 3. `user_sessions`
Tracks user preferences and stats.

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    current_conversation_id UUID,
    preferences JSONB,
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    last_active_at TIMESTAMP
);
```

#### 4. `conversation_analytics`
Stores metrics and analytics.

```sql
CREATE TABLE conversation_analytics (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    total_messages INTEGER,
    total_tokens INTEGER,
    avg_response_time_ms NUMERIC,
    user_satisfaction_score INTEGER,
    topics JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Helper Functions

#### Get or Create Conversation
```sql
SELECT get_or_create_conversation('user-123');
```

#### Get Conversation History
```sql
SELECT * FROM get_conversation_history(
    'conversation-uuid',
    10  -- limit
);
```

#### Search Messages Semantically
```sql
SELECT * FROM search_conversation_messages(
    embedding_vector,
    'user-123',  -- user_id (optional)
    0.7,         -- threshold
    5            -- limit
);
```

---

## ⚡ Advanced Features

### 1. RAG (Retrieval Augmented Generation)

The system uses RAG to provide accurate answers:

**How it works:**
1. User asks: "What is Module 1 about?"
2. System generates embedding for question
3. Searches both FAQs and course materials
4. Retrieves top 3 most relevant documents
5. Passes documents + question to GPT-4o-mini
6. GPT generates answer based on retrieved context

**Benefits:**
- ✅ Accurate, source-based answers
- ✅ Reduced hallucinations
- ✅ Traceable information
- ✅ Cost-effective (smaller context window)

### 2. Conversation Context Management

The chatbot maintains context across messages:

```javascript
// Conversation history is automatically included
const conversationHistory = await getConversationHistory(conversationId, 10);

// Last 6 messages are passed to GPT for context
const historyMessages = conversationHistory.slice(-6).map(msg => ({
  role: msg.role,
  content: msg.content
}));
```

**Example:**
```
User: "What is AI?"
Bot: "AI is artificial intelligence..."

User: "How can I use it in my business?"
Bot: "Based on what we discussed about AI, here are ways..." ← Remembers context
```

### 3. Multi-User Support

Each user has isolated conversations:

```javascript
// Row-level security ensures users only see their data
CREATE POLICY conversations_user_policy ON conversations
    FOR ALL
    USING (user_id = current_setting('app.current_user_id', true));
```

### 4. Source Citations

Every response includes sources:

```json
{
  "answer": "Module 1 covers...",
  "sources": [
    {
      "question": "What is Module 1 about?",
      "answer": "Module 1 introduces...",
      "similarity": 0.89,
      "category": "Module 1"
    }
  ]
}
```

### 5. Analytics & Monitoring

Track chatbot performance:

```sql
SELECT 
    COUNT(*) as total_conversations,
    AVG(total_messages) as avg_messages_per_conversation,
    AVG(avg_response_time_ms) as avg_response_time
FROM conversation_analytics;
```

---

## 🚀 Deployment

### Option 1: Render (Recommended)

1. **Create new Web Service**
   - Repository: Your GitHub repo
   - Branch: main
   - Root Directory: `chatbot-server`
   - Build Command: `npm install`
   - Start Command: `node enhanced-server.js`

2. **Environment Variables**
   ```
   OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_KEY=...
   CHATBOT_PORT=3001
   ```

3. **Update n8n**
   - Change HTTP Request URL to: `https://your-app.onrender.com/api/chat`

### Option 2: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd chatbot-server
railway up
```

### Option 3: Vercel (Next.js API Routes)

Convert to Next.js API routes:

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  // Move logic from enhanced-server.js here
}
```

### Option 4: Local with ngrok (Development)

```bash
# Terminal 1: Start server
cd chatbot-server
node enhanced-server.js

# Terminal 2: Expose with ngrok
ngrok http 3001

# Copy ngrok URL and update n8n
```

---

## 🧪 Testing

### 1. Test Database Setup

```bash
# Check tables exist
psql $DATABASE_URL -c "\dt"

# Should show:
# - conversations
# - messages
# - user_sessions
# - conversation_analytics
```

### 2. Test API Server

```bash
# Health check
curl http://localhost:3001/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

### 3. Test n8n Webhook

```bash
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, chatbot!",
    "userId": "test-user-456"
  }'
```

### 4. Test Frontend Widget

1. Start Next.js dev server: `npm run dev`
2. Open browser: `http://localhost:3000`
3. Click chatbot button (bottom-right)
4. Send test message
5. Verify response appears

### 5. End-to-End Test

```bash
# Run comprehensive test
cd chatbot-server
node test-api.js
```

---

## 🐛 Troubleshooting

### Issue: "Webhook not registered"

**Solution:**
1. Open n8n workflow
2. Click "Execute Workflow" (test mode)
3. OR activate workflow (production mode)
4. Verify webhook path is `chatbot-webhook`

### Issue: "Connection timeout"

**Causes:**
- API server not running
- Wrong URL in n8n
- Firewall blocking requests

**Solutions:**
```bash
# Check server is running
curl http://localhost:3001/health

# Use ngrok for local dev
ngrok http 3001

# Update n8n with ngrok URL
```

### Issue: "No conversation history"

**Solution:**
```sql
-- Check if tables exist
SELECT * FROM conversations LIMIT 1;

-- Run migration if needed
psql $DATABASE_URL -f migrations/003_create_chat_tables.sql
```

### Issue: "Embeddings not working"

**Solution:**
```bash
# Regenerate embeddings
node scripts/generate-embeddings.js
node scripts/generate-course-embeddings.js

# Verify in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM faqs WHERE embedding IS NOT NULL;"
```

### Issue: "Rate limit exceeded"

**Solution:**
- Add delays between requests
- Implement request queuing
- Upgrade OpenAI plan
- Cache common responses

---

## 📊 Cost Breakdown

### OpenAI Costs

**Embeddings (text-embedding-3-small):**
- $0.00002 per 1K tokens
- ~100 tokens per FAQ
- 60 FAQs = $0.0012

**Chat (GPT-4o-mini):**
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens
- Average conversation: ~500 tokens
- 1000 conversations = ~$0.38

**Monthly estimate (1000 users, 5 messages each):**
- Embeddings: ~$0.10
- Chat completions: ~$1.90
- **Total: ~$2.00/month**

### Infrastructure Costs

- **Supabase**: Free tier (up to 500MB database)
- **n8n Cloud**: Free tier (5K executions/month)
- **Render/Railway**: $7/month (basic plan)

**Total monthly cost: ~$9-10**

---

## 🎯 Best Practices

### 1. Security

```typescript
// Validate user input
if (!message || message.length > 1000) {
  throw new Error('Invalid message');
}

// Sanitize before storing
const sanitized = message.trim().substring(0, 1000);

// Use environment variables
const apiKey = process.env.OPENAI_API_KEY;
```

### 2. Performance

```typescript
// Cache common responses
const cache = new Map();

// Limit conversation history
const history = await getHistory(conversationId, 10); // Not 100

// Use connection pooling
const supabase = createClient(url, key, {
  db: { pool: { max: 10 } }
});
```

### 3. User Experience

```typescript
// Show typing indicator
setIsLoading(true);

// Handle errors gracefully
catch (error) {
  showMessage("I'm having trouble right now. Please try again.");
}

// Provide source citations
if (sources.length > 0) {
  showSources(sources);
}
```

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [n8n Documentation](https://docs.n8n.io)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

---

## ✅ Deployment Checklist

- [ ] Database migration applied
- [ ] Course embeddings generated
- [ ] Environment variables configured
- [ ] API server running and accessible
- [ ] n8n workflow imported and activated
- [ ] Frontend widget integrated
- [ ] End-to-end test passed
- [ ] Error handling tested
- [ ] Production URL updated in n8n
- [ ] Monitoring and logging configured

---

**Version:** 2.0.0  
**Last Updated:** 2024  
**Support:** Check troubleshooting section or review server logs
