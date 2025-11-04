# ⚡ Quick Start Guide

Get your chatbot up and running in 10 minutes!

---

## 🎯 What You're Building

A complete chatbot system that:
1. Receives questions from users via n8n webhook
2. Searches your FAQ database using AI embeddings
3. Generates intelligent responses using GPT-4o-mini
4. Returns answers with relevant sources

---

## 📋 Prerequisites

- ✅ Node.js 20.x or higher
- ✅ OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- ✅ Supabase account ([Sign up here](https://supabase.com))
- ✅ n8n cloud account ([Sign up here](https://n8n.io))

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies (2 min)

```bash
cd chatbot-server
npm install
```

### Step 2: Configure Environment (3 min)

```bash
# Copy the template
cp .env.example .env

# Edit with your credentials
nano .env
```

Add these values:
```env
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Where to find these:**
- **OpenAI API Key**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Supabase URL & Key**: Supabase Dashboard → Settings → API

### Step 3: Start the Server (1 min)

```bash
npm start
```

You should see:
```
🚀 CHATBOT API SERVER STARTED
📍 Local:    http://localhost:3001
```

### Step 4: Test the API (1 min)

Open a new terminal and run:

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

You should get a JSON response with an answer!

### Step 5: Expose to n8n with ngrok (2 min)

Since your API is running locally, n8n cloud can't reach it. Use ngrok:

```bash
# Install ngrok (macOS)
brew install ngrok

# Start ngrok in a new terminal
ngrok http 3001
```

Copy the `https://` URL from ngrok output:
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3001
```

### Step 6: Configure n8n Workflow (3 min)

1. **Open your n8n workflow**

2. **Add Webhook Node:**
   - HTTP Method: `POST`
   - Path: `chatbot-webhook`
   - Response Mode: `When Last Node Finishes`

3. **Add HTTP Request Node:**
   - Method: `POST`
   - URL: `https://abc123.ngrok-free.app/api/chat` (your ngrok URL)
   - Body: `{{ $json }}`

4. **Connect the nodes:** Webhook → HTTP Request

5. **Click "Execute Workflow"**

### Step 7: Test End-to-End (1 min)

```bash
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

🎉 **Success!** You should get an AI-generated response!

---

## 🧪 Verify Everything Works

Run the automated test suite:

```bash
# Test the API
npm test

# Test the n8n webhook
./test-n8n-webhook.sh

# Run diagnostics
node debug-workflow.js
```

---

## 🐛 Troubleshooting

### "Webhook not registered"

**Solution:** Click "Execute Workflow" in n8n before testing

### "Cannot connect to API"

**Solution:** Make sure ngrok is running and URL is correct in n8n

### "OpenAI API error"

**Solution:** Check your API key and ensure you have credits

### More Issues?

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

---

## 📚 Next Steps

### For Development:

1. **Keep ngrok running** while developing
2. **Monitor logs** in the server terminal
3. **Test changes** with `npm test`
4. **Check n8n executions** for debugging

### For Production:

1. **Deploy to cloud** (see [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md))
2. **Update n8n URL** to your production URL
3. **Activate workflow** in n8n (not just execute)
4. **Set up monitoring** and error tracking

---

## 📖 Documentation

- **[README.md](./README.md)** - Overview and API reference
- **[N8N-WORKFLOW-GUIDE.md](./N8N-WORKFLOW-GUIDE.md)** - Detailed n8n setup
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues
- **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** - Production deployment

---

## 🎯 Architecture Overview

```
User Question
    ↓
n8n Webhook (https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook)
    ↓
Your API (via ngrok: https://abc123.ngrok-free.app/api/chat)
    ↓
    ├─→ OpenAI (Generate embedding)
    ├─→ Supabase (Search FAQs)
    └─→ OpenAI (Generate response)
    ↓
AI Answer + Sources
    ↓
Back to User
```

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Server starts successfully (`npm start`)
- [ ] API test passes (`npm test`)
- [ ] ngrok running and URL copied
- [ ] n8n workflow configured
- [ ] n8n workflow executed
- [ ] End-to-end test successful
- [ ] Ready for production deployment

---

## 💡 Pro Tips

1. **Keep terminals organized:**
   - Terminal 1: Server (`npm start`)
   - Terminal 2: ngrok (`ngrok http 3001`)
   - Terminal 3: Testing commands

2. **Monitor everything:**
   - Server logs show all requests
   - ngrok web UI: `http://127.0.0.1:4040`
   - n8n executions tab

3. **Test frequently:**
   - After any code change
   - Before deploying
   - After updating environment variables

4. **Use the debug script:**
   ```bash
   node debug-workflow.js
   ```
   This checks everything automatically!

---

## 🆘 Need Help?

1. **Run diagnostics:** `node debug-workflow.js`
2. **Check logs:** Look at server terminal output
3. **Review guides:** See TROUBLESHOOTING.md
4. **Test components:** Test API and webhook separately

---

**Ready to go? Start with Step 1! 🚀**
