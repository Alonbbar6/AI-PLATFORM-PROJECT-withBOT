/**
 * Chatbot API Service Layer
 * Handles all communication with the n8n webhook and backend API
 */

export interface ChatMessage {
  message: string;
  userId: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources?: Array<{
    question: string;
    answer: string;
    similarity: number;
    category: string;
  }>;
  conversationId?: string;
  timestamp?: string;
  responseTime?: string;
  metadata?: Record<string, any>;
}

export interface ConversationHistory {
  id: string;
  userId: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

class ChatbotAPI {
  private n8nWebhookUrl: string;
  private apiBaseUrl: string;

  constructor() {
    // Use environment variables with fallbacks
    this.n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 
      'https://aiforepic.app.n8n.cloud/webhook/chatbot-webhook';
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 
      'http://localhost:3001';
  }

  /**
   * Send a message to the chatbot via n8n webhook
   */
  async sendMessage(data: ChatMessage): Promise<ChatResponse> {
    try {
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Send message directly to backend API (bypass n8n)
   */
  async sendMessageDirect(data: ChatMessage): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending message to API:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationHistory[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/conversations/${userId}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.conversations || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/conversations/${conversationId}/messages`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.messages || [];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/conversations/${conversationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  /**
   * Search across all conversations
   */
  async searchConversations(query: string, userId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/search?q=${encodeURIComponent(query)}&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const chatbotAPI = new ChatbotAPI();

// Export class for custom instances
export default ChatbotAPI;
