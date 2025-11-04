# Conversation Memory Setup Guide

## Overview
Your chatbot now has conversation memory! It will remember previous messages in the conversation and provide contextual responses.

## How It Works

### Server-Side (Automatic)
The chatbot server now:
1. ✅ Stores conversation history in memory for each user
2. ✅ Tracks up to 20 messages per user (10 exchanges)
3. ✅ Sends conversation history to n8n with each request
4. ✅ Automatically manages message history

### n8n Configuration Required

#### Update Code Node 1 (Build System Prompt)
Replace your first JavaScript code node with this:

```javascript
// Get the webhook data
const webhookData = $input.item.json.body || $input.item.json;

// Extract data
const userMessage = webhookData.userMessage || webhookData.message || "Hello";
const conversationHistory = webhookData.conversationHistory || [];
const userId = webhookData.userId || "unknown";

const systemContext = webhookData.systemContext || {
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

// Build the system prompt
const systemPrompt = `You are an ${systemContext.role} for an AI training platform.

YOUR CAPABILITIES:
${systemContext.capabilities.map(c => `- ${c}`).join('\n')}

PLATFORM FEATURES:
${systemContext.platformFeatures.map(f => `- ${f}`).join('\n')}

INSTRUCTIONS:
${systemContext.instructions.map(i => `- ${i}`).join('\n')}

IMPORTANT:
- Remember the conversation context
- Reference previous messages when relevant
- Be specific and actionable
- When asked about navigation, provide step-by-step directions
- When asked for Spanish, respond in Spanish`;

// Build conversation messages for OpenAI
const messages = [
  { role: 'system', content: systemPrompt }
];

// Add conversation history (last 10 messages to stay within token limits)
const recentHistory = conversationHistory.slice(-10);
for (const msg of recentHistory) {
  messages.push({
    role: msg.role,
    content: msg.content
  });
}

return {
  json: {
    messages: messages,
    userMessage: userMessage,
    userId: userId
  }
};
```

#### Update OpenAI Node Configuration

**Option 1: Using Messages Array (Recommended)**
In your OpenAI node:
1. Set **Messages** to: `{{ $json.messages }}`
2. This passes the entire conversation history

**Option 2: Manual Configuration**
If Option 1 doesn't work, configure messages manually:
1. **System Message:** `{{ $json.messages[0].content }}`
2. **Previous Messages:** Loop through `{{ $json.messages }}` starting from index 1

## Testing Conversation Memory

Try this conversation flow:

**Message 1:** "My name is John"
**Expected:** "Nice to meet you, John! How can I help you today?"

**Message 2:** "What's my name?"
**Expected:** "Your name is John."

**Message 3:** "Help me navigate to the courses"
**Expected:** Provides navigation steps

**Message 4:** "What did I just ask you?"
**Expected:** References the navigation question

## Data Structure

### What the Server Sends to n8n:
```json
{
  "userMessage": "Current user message",
  "userId": "user-123",
  "systemContext": { ... },
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous user message",
      "timestamp": "2025-10-30T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Previous AI response",
      "timestamp": "2025-10-30T10:00:01.000Z"
    }
  ],
  "context": []
}
```

## Memory Limits

- **Per User:** 20 messages (10 exchanges)
- **Automatic Cleanup:** Old messages are removed when limit is reached
- **Storage:** In-memory (resets when server restarts)

## Production Considerations

For production, consider:
1. **Database Storage:** Store conversations in Supabase
2. **User Sessions:** Implement proper session management
3. **Clear History:** Add endpoint to clear conversation history
4. **Privacy:** Implement data retention policies

## Troubleshooting

### Chatbot Still Forgets
1. Check n8n logs to verify `conversationHistory` is received
2. Verify OpenAI node is using `{{ $json.messages }}`
3. Restart the chatbot server

### Token Limit Errors
- Reduce history limit from 20 to 10 messages
- Summarize old conversations before sending to OpenAI

### Server Restart Clears Memory
- This is expected with in-memory storage
- For persistence, implement database storage

## Next Steps

1. ✅ Update n8n Code Node 1 with the new code
2. ✅ Update OpenAI node to use `{{ $json.messages }}`
3. ✅ Test conversation memory
4. ✅ Monitor token usage in n8n executions
5. Consider implementing database storage for production
