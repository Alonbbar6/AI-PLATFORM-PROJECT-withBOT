# 🔧 Chatbot "Failed to get response" - Quick Fix Guide

**Error**: `Failed to get response` in ChatbotWidget  
**Location**: Line 87 in `app/components/ChatbotWidget.tsx`  
**Status**: ⚠️ Chatbot UI works, backend connection broken

---

## 🎯 Problem Summary

The chatbot widget is successfully integrated and displays correctly, but when you send a message, it fails to connect to the n8n webhook at:
```
https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

---

## 🚀 Solution Options (Choose One)

### Option A: Fix n8n Webhook (Recommended for Production)

#### Step 1: Check n8n Workflow Status
1. Go to: https://aiforepic.app.n8n.cloud
2. Login to your n8n account
3. Find your chatbot workflow
4. **Make sure it's ACTIVE** (toggle should be ON, not just test mode)

#### Step 2: Test the Webhook
```bash
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","userId":"test","conversationId":null}'
```

**Expected Response**:
```json
{
  "answer": "Hello! How can I help you?",
  "conversationId": "some-uuid",
  "sources": []
}
```

**If you get an error**: The workflow is not active or the webhook URL is wrong.

#### Step 3: Update Webhook URL (if needed)
If your webhook URL is different, update it in `ChatbotWidget.tsx`:

```typescript
// Line 74 in app/components/ChatbotWidget.tsx
const response = await fetch('YOUR_ACTUAL_N8N_WEBHOOK_URL', {
```

---

### Option B: Use Direct API (Faster for Development)

This bypasses n8n and connects directly to your chatbot API server.

#### Step 1: Update ChatbotWidget.tsx

Replace the fetch call (lines 73-84) with:

```typescript
// Call chatbot API directly instead of n8n
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: inputMessage,
    userId: userId,
    conversationId: conversationId,
    includeHistory: true
  })
});
```

#### Step 2: Start the Chatbot Server

Open a **new terminal** and run:

```bash
cd /Users/user/Desktop/teams\ ai\ project/AI-PLATFORM-PROJECT
npm run chatbot:dev
```

You should see:
```
🚀 Enhanced Chatbot API Server
✓ Server running on http://localhost:3001
✓ Health check: http://localhost:3001/health
```

#### Step 3: Keep Both Servers Running

You need **TWO terminals**:

**Terminal 1** (Next.js):
```bash
npm run dev
```

**Terminal 2** (Chatbot API):
```bash
npm run chatbot:dev
```

---

### Option C: Hybrid Approach (Best of Both Worlds)

Use environment variables to switch between n8n and direct API.

#### Step 1: Add to .env
```bash
# Chatbot Configuration
NEXT_PUBLIC_CHATBOT_MODE=direct  # or 'n8n'
NEXT_PUBLIC_CHATBOT_API_URL=http://localhost:3001/api/chat
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

#### Step 2: Update ChatbotWidget.tsx

Replace the fetch call with:

```typescript
// Determine which endpoint to use
const chatbotMode = process.env.NEXT_PUBLIC_CHATBOT_MODE || 'n8n';
const apiUrl = chatbotMode === 'direct' 
  ? process.env.NEXT_PUBLIC_CHATBOT_API_URL 
  : process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

const response = await fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: inputMessage,
    userId: userId,
    conversationId: conversationId
  })
});
```

Now you can switch modes by changing the `.env` file!

---

## 🧪 Testing Your Fix

### Test 1: Health Check (Direct API only)
```bash
curl http://localhost:3001/health
```

**Expected**: `{"status":"ok","timestamp":"..."}`

### Test 2: Send Test Message
```bash
# For direct API
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is Module 1 about?","userId":"test"}'

# For n8n webhook
curl -X POST https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"What is Module 1 about?","userId":"test"}'
```

### Test 3: Browser Test
1. Open http://localhost:3000
2. Click the blue chat button (bottom-right)
3. Type: "What is Module 1 about?"
4. Press Enter
5. You should get a response!

---

## 🔍 Troubleshooting

### Error: "Connection refused" (Direct API)
**Cause**: Chatbot server not running  
**Fix**: Run `npm run chatbot:dev` in a separate terminal

### Error: "404 Not Found" (n8n)
**Cause**: Workflow not active or wrong URL  
**Fix**: Activate workflow in n8n dashboard

### Error: "Invalid API key" (Direct API)
**Cause**: Wrong Supabase service key  
**Fix**: Update `SUPABASE_SERVICE_KEY` in `.env` (see main analysis)

### Error: "CORS policy" (Direct API)
**Cause**: CORS not configured  
**Fix**: Already configured in `enhanced-server.js`, should work

### Chatbot opens but no response
**Cause**: Backend not connected  
**Fix**: Check browser console (F12) for error details

---

## 📝 Quick Implementation (Copy-Paste Ready)

### For Option B (Direct API) - Fastest Fix

**File**: `app/components/ChatbotWidget.tsx`

**Find** (around line 73):
```typescript
const response = await fetch('https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook', {
```

**Replace with**:
```typescript
const response = await fetch('http://localhost:3001/api/chat', {
```

**Then run**:
```bash
# Terminal 1
npm run chatbot:dev

# Terminal 2
npm run dev
```

**Done!** 🎉

---

## ✅ Verification Checklist

After implementing your fix:

- [ ] Chatbot button appears (blue circle, bottom-right)
- [ ] Clicking opens chat window
- [ ] Can type messages
- [ ] Pressing Enter sends message
- [ ] Loading indicator appears
- [ ] Response appears within 2-3 seconds
- [ ] Can send multiple messages
- [ ] Conversation history maintained
- [ ] No errors in browser console (F12)

---

## 🎯 Recommended Approach

**For Development** (Right Now):
- ✅ Use **Option B** (Direct API)
- ✅ Fastest to implement
- ✅ Easier to debug
- ✅ No external dependencies

**For Production** (Later):
- ✅ Use **Option A** (n8n Webhook)
- ✅ Better scalability
- ✅ Workflow automation
- ✅ Easier monitoring

**Best Practice**:
- ✅ Use **Option C** (Hybrid)
- ✅ Switch via environment variables
- ✅ Development = direct API
- ✅ Production = n8n webhook

---

## 💡 Pro Tips

1. **Keep terminals visible**: You need to see both servers running
2. **Check logs**: Errors will show in the chatbot server terminal
3. **Browser console**: Press F12 to see frontend errors
4. **Test incrementally**: Fix one thing at a time
5. **Use curl first**: Test API before testing UI

---

## 🚀 Next Steps After Fix

Once chatbot is working:

1. **Setup database**: `npm run setup:chatbot`
2. **Generate embeddings**: Already done ✅
3. **Test with real questions**: Ask about course content
4. **Customize**: Change colors, position, etc.
5. **Deploy**: Follow `DEPLOYMENT-CHECKLIST.md`

---

## 📞 Still Having Issues?

### Check These Files:
1. `.env` - Verify all API keys are correct
2. `chatbot-server/enhanced-server.js` - Check if server starts
3. Browser console (F12) - Look for error messages
4. Chatbot server terminal - Look for connection errors

### Common Mistakes:
- ❌ Forgot to start chatbot server
- ❌ Wrong Supabase service key
- ❌ n8n workflow not active
- ❌ Firewall blocking localhost:3001
- ❌ Port 3001 already in use

### Quick Debug:
```bash
# Check if port 3001 is in use
lsof -i :3001

# Check if Next.js is running
lsof -i :3000

# Verify environment variables
cat .env | grep -E "SUPABASE|OPENAI"
```

---

**Fix Time**: 5-10 minutes  
**Difficulty**: Easy  
**Impact**: High - Makes chatbot fully functional!

Good luck! 🚀
