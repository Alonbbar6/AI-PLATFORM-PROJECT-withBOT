# Local OpenAI Setup Guide

## Overview
Your chatbot now supports **TWO MODES**:
1. **LOCAL MODE** - Uses OpenAI API directly (recommended for testing)
2. **N8N MODE** - Uses your n8n workflow

## Quick Setup - Local Mode

### Step 1: Get Your OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Update `.env` File
Open `/chatbot-server/.env` and replace:
```
OPENAI_API_KEY=your_openai_api_key_here
```

With your actual key:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Step 3: Enable Local Mode
Make sure this line is set to `true`:
```
USE_LOCAL_OPENAI=true
```

### Step 4: Install OpenAI Package
```bash
cd chatbot-server
npm install openai
```

### Step 5: Restart Server
```bash
node server.js
```

You should see:
```
🤖 Mode: LOCAL OPENAI
```

## Testing

Send a message through your chatbot:
- **Input:** "hello my name is Alonso"
- **Expected:** "Hello Alonso! I'm doing great, thank you! I'm your AI Training Platform Assistant. How can I help you today?"

## Features

✅ **Conversation Memory** - Remembers previous messages  
✅ **Proper System Prompt** - Acts as AI Training Assistant  
✅ **No n8n Required** - Works completely locally  
✅ **Easy to Test** - Modify prompts in `server.js` and restart  
✅ **Spanish Support** - Responds in Spanish when requested  

## Switching Between Modes

### Use Local OpenAI (Recommended for Testing)
```env
USE_LOCAL_OPENAI=true
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### Use n8n (For Production)
```env
USE_LOCAL_OPENAI=false
N8N_WEBHOOK_URL=https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook
```

## Customizing the AI

Edit the `systemPrompt` in `server.js` (around line 170):

```javascript
const systemPrompt = `You are an AI Training Platform Assistant...

YOUR ROLE:
- Answer questions about AI training courses
- Help users navigate the platform
- [Add your custom instructions here]

IMPORTANT RULES:
- [Add your custom rules here]
`;
```

After editing, restart the server to see changes.

## Cost Considerations

### Local OpenAI Mode
- **Cost:** ~$0.0001 per message (very cheap!)
- **Model:** gpt-4o-mini
- **Billing:** Pay-as-you-go on OpenAI account

### n8n Mode
- **Cost:** Depends on your n8n plan
- **Complexity:** Requires workflow configuration
- **Debugging:** Harder to troubleshoot

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"
- Make sure you replaced `your_openai_api_key_here` with your actual key
- Key should start with `sk-`

### Error: "Cannot find module 'openai'"
```bash
cd chatbot-server
npm install openai
```

### Chatbot still telling stories
- Make sure `USE_LOCAL_OPENAI=true` in `.env`
- Restart the server
- Check server logs for "Mode: LOCAL OPENAI"

### Want to switch back to n8n
- Set `USE_LOCAL_OPENAI=false` in `.env`
- Restart server

## Next Steps

1. ✅ Test locally with OpenAI
2. ✅ Perfect your system prompt
3. ✅ Test conversation memory
4. ✅ Test Spanish translation
5. When satisfied, switch to n8n mode and copy the working prompt

## Benefits of This Approach

- **Fast iteration** - No n8n workflow debugging
- **Full control** - Edit prompts directly in code
- **Easy testing** - Restart server to see changes
- **Cost effective** - OpenAI is very cheap for testing
- **Production ready** - Switch to n8n when ready
