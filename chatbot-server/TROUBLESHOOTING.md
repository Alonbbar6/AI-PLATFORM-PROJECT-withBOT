# 🔧 Troubleshooting Guide

Complete troubleshooting guide for the AI Training Platform chatbot integration.

---

## 🎯 Quick Diagnosis

Run this command first to diagnose all issues:

```bash
node debug-workflow.js
```

This will check:
- ✅ API server status
- ✅ n8n webhook accessibility
- ✅ Environment variables
- ✅ Network connectivity
- ✅ Supabase function

---

## 🐛 Common Issues

### 1. "Webhook not registered"

#### Symptoms:
```json
{
  "code": 404,
  "message": "The requested webhook 'chatbot-webhook' is not registered."
}
```

#### Causes & Solutions:

**Cause 1: Workflow not active**
```bash
✅ Solution:
1. Open n8n workflow
2. Click "Execute Workflow" (test mode)
   OR
3. Toggle workflow to ACTIVE (production)
```

**Cause 2: Wrong webhook path**
```bash
✅ Solution:
1. Check webhook URL matches exactly
2. Path should be: chatbot-webhook
3. No leading slash: ❌ /chatbot-webhook
4. Correct: ✅ chatbot-webhook
```

**Cause 3: Test mode expired**
```bash
✅ Solution:
1. Test mode only lasts 2 minutes
2. Click "Execute Workflow" again
3. Send request immediately
4. Or use production mode
```

---

### 2. "Not registered for POST requests"

#### Symptoms:
```json
{
  "code": 404,
  "message": "This webhook is not registered for POST requests. Did you mean to make a GET request?"
}
```

#### Solution:
```bash
1. Open Webhook node in n8n
2. Find "HTTP Method" setting
3. Change from GET to POST
4. Save workflow
5. Reactivate/re-execute
```

---

### 3. "Not registered for GET requests"

#### Symptoms:
```json
{
  "code": 404,
  "message": "This webhook is not registered for GET requests. Did you mean to make a POST request?"
}
```

#### Solution:
```bash
Your curl command is wrong. Use:

❌ Wrong:
curl https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook

✅ Correct:
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "userId": "test"}'
```

---

### 4. API Server Not Starting

#### Symptoms:
```bash
Error: Missing required environment variables
```

#### Solution:
```bash
1. Copy environment template:
   cp .env.example .env

2. Edit .env and fill in:
   - OPENAI_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

3. Restart server:
   npm start
```

---

### 5. Connection Timeout

#### Symptoms:
```
Error: Connection timeout
ECONNREFUSED
```

#### Causes & Solutions:

**Cause 1: API server not running**
```bash
✅ Solution:
1. Start the server: npm start
2. Check it's running: curl http://localhost:3001/health
```

**Cause 2: n8n can't reach localhost**
```bash
✅ Solution:
n8n cloud cannot access your localhost.
Use ngrok to expose your local server:

1. Install ngrok: brew install ngrok
2. Start ngrok: ngrok http 3001
3. Copy the https URL
4. Update HTTP Request node URL in n8n
```

**Cause 3: Firewall blocking**
```bash
✅ Solution:
1. Check firewall settings
2. Allow port 3001
3. Or deploy to cloud
```

---

### 6. OpenAI API Errors

#### Symptoms:
```
Error: Failed to generate embedding
401 Unauthorized
```

#### Solutions:

**Invalid API Key:**
```bash
1. Check OPENAI_API_KEY in .env
2. Verify key at: https://platform.openai.com/api-keys
3. Make sure key starts with: sk-
4. Restart server after updating
```

**Rate Limit:**
```bash
1. Wait a few minutes
2. Check usage at: https://platform.openai.com/usage
3. Upgrade plan if needed
```

**Insufficient Credits:**
```bash
1. Add credits at: https://platform.openai.com/billing
2. Check current balance
```

---

### 7. Supabase Errors

#### Symptoms:
```
Error: Failed to search FAQs
relation "faqs" does not exist
```

#### Solutions:

**Missing Table:**
```bash
1. Run migrations:
   cd migrations
   psql -h your-db.supabase.co -U postgres -d postgres -f 001_create_faqs_table.sql

2. Or use Supabase SQL Editor
3. Copy contents of 001_create_faqs_table.sql
4. Run in SQL Editor
```

**Missing Function:**
```bash
1. The match_faqs function might not exist
2. Check migrations/001_create_faqs_table.sql
3. Run the CREATE FUNCTION statement
```

**Wrong Credentials:**
```bash
1. Check NEXT_PUBLIC_SUPABASE_URL
2. Check SUPABASE_SERVICE_ROLE_KEY
3. Get from: Supabase Dashboard > Settings > API
4. Use SERVICE ROLE key, not ANON key
```

**No Embeddings:**
```bash
1. Generate embeddings:
   npm run generate:embeddings

2. Verify:
   npm run verify:embeddings

3. Check data/faqs.json exists
```

---

### 8. CORS Errors

#### Symptoms:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

#### Solution:
```javascript
// In server.js, update CORS config:

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.com',
    'https://aiforepic.app.n8n.cloud'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 9. Empty or Wrong Response

#### Symptoms:
```json
{
  "success": true,
  "answer": "",
  "sources": []
}
```

#### Causes & Solutions:

**No matching FAQs:**
```bash
1. Check if embeddings exist:
   npm run verify:embeddings

2. Lower similarity threshold in server.js:
   match_threshold: 0.3  // Was 0.5

3. Add more FAQs to data/faqs.json
```

**OpenAI not responding:**
```bash
1. Check API key is valid
2. Check OpenAI status: https://status.openai.com
3. Try a simpler query
```

---

### 10. n8n Execution Errors

#### How to Check:

```bash
1. Go to n8n dashboard
2. Click "Executions" tab
3. Find your latest execution
4. Click to view details
5. Check each node:
   - Green = Success
   - Red = Error
6. Click on red nodes to see error
```

#### Common Execution Errors:

**Webhook timeout:**
```bash
✅ Solution:
1. Increase timeout in HTTP Request node
2. Optimize API response time
3. Check API server logs
```

**Invalid JSON:**
```bash
✅ Solution:
1. Check body format in HTTP Request node
2. Use {{ $json }} to pass through
3. Verify Content-Type header
```

---

## 🔍 Debugging Steps

### Step 1: Test API Independently

```bash
# Start server
npm start

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

**Expected:** Should return success response

---

### Step 2: Test n8n Webhook

```bash
# Make sure workflow is active
# Then test webhook

./test-n8n-webhook.sh
```

**Expected:** Should return API response

---

### Step 3: Check Logs

**API Server Logs:**
```bash
# Server logs show:
- Request received
- Embedding generation
- FAQ search
- AI response
- Response sent
```

**n8n Execution Logs:**
```bash
# In n8n dashboard:
- Webhook input
- HTTP Request output
- Any errors
```

---

### Step 4: Verify Environment

```bash
node debug-workflow.js
```

**Expected:** All checks should pass

---

## 🛠️ Advanced Debugging

### Enable Verbose Logging

Add to server.js:
```javascript
// After app.use(express.json())
app.use((req, res, next) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  next();
});
```

### Test Supabase Connection

```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('faqs')
  .select('*')
  .limit(5);

console.log('Data:', data);
console.log('Error:', error);
```

### Test OpenAI Connection

```javascript
// test-openai.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'test'
});

console.log('Embedding length:', response.data[0].embedding.length);
```

---

## 📊 Health Check Checklist

Run through this checklist:

```bash
✅ Environment Variables
   [ ] OPENAI_API_KEY set
   [ ] NEXT_PUBLIC_SUPABASE_URL set
   [ ] SUPABASE_SERVICE_ROLE_KEY set

✅ API Server
   [ ] Server starts without errors
   [ ] /health returns 200
   [ ] /api/chat accepts requests

✅ Supabase
   [ ] Can connect to database
   [ ] faqs table exists
   [ ] match_faqs function exists
   [ ] Embeddings generated

✅ OpenAI
   [ ] API key valid
   [ ] Can generate embeddings
   [ ] Can generate completions

✅ n8n Workflow
   [ ] Workflow saved
   [ ] Webhook configured for POST
   [ ] HTTP Request URL correct
   [ ] Workflow active/executed

✅ Network
   [ ] API reachable from n8n
   [ ] No firewall blocking
   [ ] CORS configured
```

---

## 🆘 Still Having Issues?

### Collect Debug Information:

```bash
# 1. Run diagnostics
node debug-workflow.js > debug-output.txt

# 2. Test API
npm test > api-test-output.txt

# 3. Test webhook
./test-n8n-webhook.sh > webhook-test-output.txt

# 4. Check server logs
npm start 2>&1 | tee server-logs.txt
```

### Check These Files:

1. `debug-output.txt` - System diagnostics
2. `api-test-output.txt` - API test results
3. `webhook-test-output.txt` - Webhook test results
4. `server-logs.txt` - Server runtime logs

---

## 📞 Getting Help

When asking for help, provide:

1. **Error message** (exact text)
2. **What you tried** (steps taken)
3. **Debug output** (from debug-workflow.js)
4. **Server logs** (relevant portions)
5. **n8n execution log** (screenshot)
6. **Environment** (OS, Node version, etc.)

---

## 🎯 Prevention Tips

### Before Deployment:

1. ✅ Test everything locally first
2. ✅ Run all test scripts
3. ✅ Verify environment variables
4. ✅ Check all connections
5. ✅ Review error handling
6. ✅ Set up monitoring
7. ✅ Document your setup

### Regular Maintenance:

1. ✅ Monitor API logs
2. ✅ Check OpenAI usage
3. ✅ Verify Supabase connection
4. ✅ Update dependencies
5. ✅ Test after changes
6. ✅ Backup configuration

---

**Last Updated:** 2024
**Version:** 1.0.0
