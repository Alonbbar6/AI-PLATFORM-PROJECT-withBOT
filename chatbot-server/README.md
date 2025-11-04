# 🤖 AI Training Platform Chatbot Server

Complete Express API server for the AI Training Platform chatbot with n8n integration, OpenAI embeddings, and Supabase vector search.

---

## 🎯 Overview

This server provides a REST API that:
- ✅ Receives chat messages from users
- ✅ Generates embeddings using OpenAI
- ✅ Searches FAQs using Supabase pgvector
- ✅ Generates AI responses using GPT-4o-mini
- ✅ Integrates seamlessly with n8n workflows

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd chatbot-server
npm install
```

### 2. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

Required variables:
```env
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CHATBOT_PORT=3001
```

### 3. Start the Server

```bash
npm start
```

Expected output:
```
🚀 CHATBOT API SERVER STARTED
📍 Local:    http://localhost:3001
🏥 Health:   http://localhost:3001/health
💬 Chat:     POST http://localhost:3001/api/chat
```

### 4. Test the API

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

---

## 📁 Project Structure

```
chatbot-server/
├── server.js                    # Main Express server
├── package.json                 # Dependencies
├── .env.example                 # Environment template
├── README.md                    # This file
├── N8N-WORKFLOW-GUIDE.md       # n8n configuration guide
├── TROUBLESHOOTING.md          # Common issues and solutions
├── DEPLOYMENT-GUIDE.md         # Deployment options
├── test-api.js                 # API testing script
├── test-n8n-webhook.sh         # Webhook testing script
└── debug-workflow.js           # Diagnostic tool
```

---

## 🔌 API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "chatbot-api",
  "version": "1.0.0"
}
```

### POST /api/chat

Main chatbot endpoint.

**Request:**
```json
{
  "message": "What is Module 1 about?",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Module 1 covers the fundamentals of AI...",
  "sources": [
    {
      "question": "What topics are covered in Module 1?",
      "answer": "Module 1 covers...",
      "similarity": 0.89,
      "category": "modules"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "1234ms"
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test n8n Webhook

```bash
chmod +x test-n8n-webhook.sh
./test-n8n-webhook.sh
```

### Debug Workflow

```bash
node debug-workflow.js
```

---

## 🔄 n8n Integration

Your n8n workflow should have 2 nodes:

```
[Webhook] → [HTTP Request]
```

See [N8N-WORKFLOW-GUIDE.md](./N8N-WORKFLOW-GUIDE.md) for complete setup.

---

## 🚀 Deployment

### Option 1: ngrok (Development)

```bash
ngrok http 3001
```

### Option 2: Cloud (Production)

Deploy to Render, Railway, Heroku, or Vercel.

See [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) for details.

---

## 🔧 Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

---

## 📝 Documentation

- [N8N Workflow Guide](./N8N-WORKFLOW-GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Deployment Guide](./DEPLOYMENT-GUIDE.md)

---

**Version:** 1.0.0
