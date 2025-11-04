# n8n Workflow Setup Guide

## Overview
This guide explains how to configure your n8n workflow to create an intelligent chatbot that can:
- Navigate users through your AI training platform
- Answer questions about modules and features
- Provide Spanish translations
- Give contextual, helpful responses

## Workflow Structure

### 1. Webhook Node (Trigger)
**Configuration:**
- **HTTP Method:** POST
- **Path:** `/webhook-test/chatbot-webhook`
- **Response Mode:** Respond to Webhook

**Incoming Data Format:**
```json
{
  "userMessage": "User's question here",
  "systemContext": {
    "role": "AI Training Platform Assistant",
    "capabilities": [
      "Answer questions about AI training courses and modules",
      "Navigate users through the platform features",
      "Provide Spanish translations when requested",
      "Help with course enrollment and progress tracking",
      "Explain AI concepts for entrepreneurs and small business owners"
    ],
    "platformFeatures": [
      "Interactive AI training modules",
      "Hands-on exercises and projects",
      "Progress tracking and certificates",
      "Community support and forums",
      "Real-world business case studies"
    ],
    "instructions": [
      "Be helpful, friendly, and professional",
      "Use simple language suitable for business owners",
      "Provide specific navigation instructions when asked",
      "Offer to translate to Spanish if the user requests it",
      "If asked about navigation, provide clear step-by-step directions"
    ]
  },
  "context": []
}
```

### 2. Code Node (JavaScript) - Prepare System Prompt
**Purpose:** Build a comprehensive system prompt for OpenAI

**Code:**
```javascript
const userMessage = $input.item.json.userMessage;
const systemContext = $input.item.json.systemContext;

// Build system prompt
const systemPrompt = `You are an ${systemContext.role} for an AI training platform designed for entrepreneurs and small business owners.

YOUR CAPABILITIES:
${systemContext.capabilities.map(c => `- ${c}`).join('\n')}

PLATFORM FEATURES:
${systemContext.platformFeatures.map(f => `- ${f}`).join('\n')}

INSTRUCTIONS:
${systemContext.instructions.map(i => `- ${i}`).join('\n')}

NAVIGATION HELP:
When users ask for navigation help, provide clear step-by-step instructions like:
1. Click on the "Courses" menu at the top
2. Select the module you want to explore
3. Click "Start Learning" to begin

SPANISH TRANSLATION:
When users request Spanish translation or ask "en español", provide your response in Spanish.

IMPORTANT:
- Always respond directly to the user's specific question
- Don't give generic responses like "How can I assist you today?"
- Be specific and actionable
- If you don't know something, admit it and offer to help with something else`;

return {
  json: {
    userMessage: userMessage,
    systemPrompt: systemPrompt
  }
};
```

### 3. OpenAI Node (Chat Model)
**Configuration:**
- **Model:** gpt-4o-mini (or gpt-4)
- **Resource:** Message a Model
- **Prompt Type:** Define Below

**Messages:**
```
System Message:
{{ $json.systemPrompt }}

User Message:
{{ $json.userMessage }}
```

**Options:**
- **Temperature:** 0.7 (for balanced creativity)
- **Max Tokens:** 500
- **Top P:** 1

### 4. Code Node (JavaScript) - Format Response
**Purpose:** Format the OpenAI response for the chatbot

**Code:**
```javascript
const aiResponse = $input.item.json.message.content;

return {
  json: {
    response: aiResponse,
    timestamp: new Date().toISOString(),
    success: true
  }
};
```

### 5. Respond to Webhook Node
**Configuration:**
- **Response Mode:** Using 'Respond to Webhook' Node
- **Response Body:** 
```json
{
  "response": "={{ $json.response }}",
  "timestamp": "={{ $json.timestamp }}",
  "success": true
}
```

## Testing Your Workflow

### Test 1: Basic Question
**Input:** "What courses do you offer?"
**Expected:** Detailed response about AI training courses

### Test 2: Navigation Request
**Input:** "How do I navigate to the modules?"
**Expected:** Step-by-step navigation instructions

### Test 3: Spanish Translation
**Input:** "Can you help me in Spanish?" or "en español"
**Expected:** Response in Spanish

### Test 4: Specific Feature Question
**Input:** "How do I track my progress?"
**Expected:** Specific instructions about progress tracking

## Troubleshooting

### Issue: Generic Responses
**Cause:** System prompt not being used properly
**Solution:** Ensure the Code node is properly passing the systemPrompt to OpenAI

### Issue: No Response
**Cause:** Response format mismatch
**Solution:** Ensure the final response has a "response" field

### Issue: Not Understanding Context
**Cause:** OpenAI not receiving system context
**Solution:** Check that systemContext is being properly formatted in the prompt

## Advanced Features

### Add Conversation History
To make the chatbot remember previous messages, modify the OpenAI node to include conversation history:

```javascript
// In Code Node before OpenAI
const messages = [
  { role: 'system', content: systemPrompt },
  ...conversationHistory, // Add previous messages
  { role: 'user', content: userMessage }
];
```

### Add Language Detection
Automatically detect if the user is speaking Spanish:

```javascript
// In Code Node
const isSpanish = /español|spanish|ayuda|hola|gracias/i.test(userMessage);
if (isSpanish) {
  systemPrompt += "\n\nIMPORTANT: Respond in Spanish.";
}
```

### Add Navigation Links
Include clickable links in responses:

```javascript
// In Format Response Code Node
const responseWithLinks = aiResponse.replace(
  /navigate to (\w+)/gi,
  'navigate to <a href="/$1">$1</a>'
);
```

## Next Steps

1. **Activate your workflow** in n8n
2. **Test with various questions** to ensure proper responses
3. **Monitor the logs** in your chatbot server to see what's being sent/received
4. **Iterate and improve** the system prompt based on user interactions

## Support

If you encounter issues:
1. Check the n8n execution logs
2. Check your chatbot server logs
3. Verify the webhook URL is correct
4. Test the webhook directly using Postman or curl
