# 🔄 N8N Workflow Configuration Guide

Complete guide to setting up your n8n workflow for the AI Training Platform chatbot.

---

## 📋 Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Node Configuration](#node-configuration)
3. [Activation Steps](#activation-steps)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Workflow Overview

Your n8n workflow should have **2 nodes**:

```
[Webhook] → [HTTP Request]
```

**Flow:**
1. **Webhook Node**: Receives POST requests from users/frontend
2. **HTTP Request Node**: Forwards the request to your Express API server
3. Returns the API response back to the caller

---

## ⚙️ Node Configuration

### 1️⃣ Webhook Node Configuration

**Node Name:** `Webhook`

#### Settings:

| Parameter | Value | Notes |
|-----------|-------|-------|
| **HTTP Method** | `POST` | Must be POST, not GET |
| **Path** | `chatbot-webhook` | Your webhook path |
| **Response Mode** | `When Last Node Finishes` | Wait for API response |
| **Response Code** | `200` | Default success code |

#### Full Webhook URL:
```
https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

**Important Notes:**
- ✅ The path should NOT start with `/`
- ✅ Use `webhook` for production, `webhook-test` for testing
- ✅ Response mode must be "When Last Node Finishes" to return API data

#### Expected Input Format:
```json
{
  "message": "What is Module 1 about?",
  "userId": "user-123"
}
```

---

### 2️⃣ HTTP Request Node Configuration

**Node Name:** `Call Chatbot API`

#### Settings:

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Method** | `POST` | Match your API endpoint |
| **URL** | See below | Your API endpoint URL |
| **Authentication** | `None` | Unless you add auth |
| **Send Body** | `Yes` | ✅ Must be enabled |
| **Body Content Type** | `JSON` | Application/json |
| **Specify Body** | `Using Fields Below` | Use JSON format |

#### URL Options:

**Option 1: Local Development (with ngrok)**
```
https://YOUR-NGROK-URL.ngrok-free.app/api/chat
```

**Option 2: Cloud Deployment**
```
https://your-api-domain.com/api/chat
```

**Option 3: Local Testing (won't work from n8n cloud)**
```
http://localhost:3001/api/chat
```

#### Body Configuration:

**Method 1: Pass Through (Recommended)**
```json
{{ $json }}
```
This passes the entire webhook body to your API.

**Method 2: Explicit Mapping**
```json
{
  "message": "{{ $json.message }}",
  "userId": "{{ $json.userId }}"
}
```

#### Headers (Optional):
```
Content-Type: application/json
```

---

## 🚀 Activation Steps

### Test Mode (Development)

1. **Open your workflow** in n8n
2. **Click "Execute Workflow"** (▶️ button in top-right)
3. **Webhook becomes active** for ~2 minutes
4. **Send a test request** immediately
5. **Check execution log** in n8n

**Test Mode Limitations:**
- ⏱️ Webhook only works for ONE request
- ⏱️ Expires after 2 minutes
- ⏱️ Must click "Execute Workflow" before each test

### Production Mode

1. **Save your workflow**
2. **Toggle the workflow to ACTIVE** (switch in top-right)
3. **Webhook stays active** permanently
4. **Can handle unlimited requests**

**Production URL Format:**
```
https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

---

## 🧪 Testing

### Step 1: Test the Webhook

```bash
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": "Module 1 covers...",
  "sources": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Step 2: Check n8n Execution Log

1. Go to **Executions** tab in n8n
2. Find your latest execution
3. Click to view details
4. Check each node's input/output

### Step 3: Verify API Server

```bash
# Test API directly
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Module 1 about?",
    "userId": "test-user-123"
  }'
```

---

## 🐛 Troubleshooting

### Error: "Webhook not registered"

**Cause:** Workflow is not active or in test mode

**Solutions:**
1. ✅ Click "Execute Workflow" for test mode
2. ✅ Activate workflow for production mode
3. ✅ Check webhook path is correct
4. ✅ Verify HTTP method is POST

---

### Error: "Not registered for POST requests"

**Cause:** Webhook is set to GET instead of POST

**Solution:**
1. Open Webhook node
2. Change "HTTP Method" to `POST`
3. Save and reactivate workflow

---

### Error: "Not registered for GET requests"

**Cause:** You're sending GET but webhook expects POST

**Solution:**
Use POST method in your curl/fetch requests:
```bash
curl -X POST https://... # Not curl https://...
```

---

### Error: Connection timeout

**Cause:** API server not reachable from n8n cloud

**Solutions:**
1. ✅ Use ngrok to expose local server
2. ✅ Deploy API to cloud service
3. ✅ Check firewall settings
4. ✅ Verify API URL in HTTP Request node

---

### Error: 500 from API

**Cause:** API server error

**Solutions:**
1. ✅ Check API server logs
2. ✅ Verify environment variables
3. ✅ Test API directly (bypass n8n)
4. ✅ Check Supabase connection
5. ✅ Verify OpenAI API key

---

## 📊 Workflow Execution Flow

```
1. User/Frontend sends POST to webhook
   ↓
2. n8n Webhook Node receives request
   ↓
3. HTTP Request Node calls your API
   ↓
4. Your API processes request:
   - Generates embedding
   - Searches Supabase
   - Calls OpenAI
   - Returns response
   ↓
5. n8n returns API response to caller
```

---

## 🔐 Security Best Practices

### For Production:

1. **Add Authentication**
   - Use API keys or JWT tokens
   - Configure in HTTP Request node headers

2. **Rate Limiting**
   - Implement in your API server
   - Prevent abuse

3. **CORS Configuration**
   - Restrict allowed origins
   - Update in server.js

4. **Environment Variables**
   - Never hardcode secrets
   - Use n8n credentials manager

---

## 📝 Quick Reference

### Test Mode Workflow:
```bash
1. Open n8n workflow
2. Click "Execute Workflow"
3. Run: ./test-n8n-webhook.sh
4. Check execution log
```

### Production Workflow:
```bash
1. Save workflow
2. Toggle to ACTIVE
3. Test with real requests
4. Monitor execution logs
```

### Debugging Workflow:
```bash
1. Run: node debug-workflow.js
2. Check all diagnostics
3. Fix any issues
4. Test again
```

---

## 🎯 Common Configurations

### Configuration 1: Local Development
- **API:** `http://localhost:3001`
- **Webhook:** Test mode
- **Exposure:** ngrok required

### Configuration 2: Cloud Production
- **API:** `https://your-api.com`
- **Webhook:** Production mode
- **Exposure:** Public URL

### Configuration 3: Hybrid
- **API:** Cloud deployed
- **Webhook:** Test mode for development
- **Exposure:** No ngrok needed

---

## 📞 Support

If you're still having issues:

1. Run the debug script: `node debug-workflow.js`
2. Check n8n execution logs
3. Review API server logs
4. Test each component independently
5. Verify all environment variables

---

## ✅ Checklist

Before going to production:

- [ ] Webhook configured for POST
- [ ] HTTP Request URL is correct
- [ ] API server is running
- [ ] Environment variables set
- [ ] Supabase connection works
- [ ] OpenAI API key valid
- [ ] Test mode works
- [ ] Production mode activated
- [ ] Error handling tested
- [ ] Monitoring in place

---

**Last Updated:** 2024
**Version:** 1.0.0
