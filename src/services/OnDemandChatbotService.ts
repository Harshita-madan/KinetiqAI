/**
 * OnDemand Chatbot Service
 * 
 * This service handles communication with the OnDemand API for fitness and posture guidance.
 * The chatbot is restricted to:
 * - Explaining posture and movement issues detected by the app
 * - Providing fitness and exercise guidance
 * - Short, simple, non-medical responses
 * - NO medical diagnosis, injury treatment, or health advice
 * 
 * API Documentation: https://docs.on-demand.io/docs/chat-api
 * Authentication: Uses "apikey" header (not Authorization Bearer)
 * Endpoint: https://api.on-demand.io/chat/v1/sessions
 */

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface OnDemandResponse {
  message: string;
  data: {
    messageId: string;
    answer: string;
    status: string;
  };
}

const SYSTEM_PROMPT = `You are KinetiqAI's fitness coach assistant. Your role is ONLY to:
1. Explain posture and movement issues detected by the app
2. Provide guidance related to exercising and fitness
3. Suggest modifications and improvements to exercises

STRICT CONSTRAINTS:
- NEVER give medical diagnoses, injury treatment, or health advice
- NEVER ask questions back to the user
- NEVER go off-topic
- NEVER discuss topics unrelated to fitness, posture, or exercise
- Keep responses SHORT (2-3 sentences max)
- Keep responses SIMPLE and actionable
- Make responses safe for beginners and elderly users
- If a user question is about medical conditions, health concerns, or off-topic, respond with: "I'm here to help with fitness and posture guidance only. Please consult a healthcare professional for medical concerns."

Always prioritize user safety and clarity.`;

class OnDemandChatbotService {
  private apiKey: string;
  private baseUrl: string = 'https://api.on-demand.io';
  private sessionId: string | null = null;
  private endpointId: string = 'predefined-openai-gpt4o';
  private conversationHistory: ChatMessage[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize chat session (call once before first message)
   */
  async initializeSession(): Promise<void> {
    if (this.sessionId) {
      return; // Session already initialized
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          externalUserId: `user-${Date.now()}`,
          pluginIds: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create chat session: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      this.sessionId = data.data?.id;

      if (!this.sessionId) {
        throw new Error('No session ID returned from API');
      }

      console.log('OnDemand chat session created:', this.sessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('OnDemand Session Init Error:', errorMessage);
      throw error;
    }
  }

  /**
   * Sends a message to the OnDemand chatbot and returns a response
   */
  async sendMessage(userMessage: string): Promise<string> {
    if (!userMessage.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Ensure session is initialized
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      // Add user message to conversation history
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        content: userMessage,
        role: 'user',
        timestamp: new Date(),
      };
      this.conversationHistory.push(userMsg);

      // Prepare the query with conversation context
      const contextMessages = this.conversationHistory
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const fullQuery = `${SYSTEM_PROMPT}\n\nConversation:\n${contextMessages}`;

      console.log('Sending query to OnDemand:', {
        sessionId: this.sessionId,
        endpointId: this.endpointId,
      });

      // Submit query to OnDemand Chat API
      const response = await fetch(
        `${this.baseUrl}/chat/v1/sessions/${this.sessionId}/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            endpointId: this.endpointId,
            query: fullQuery,
            pluginIds: [],
            responseMode: 'sync',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `API Error: ${response.status} - ${errorData.message || response.statusText}`;
        console.error('OnDemand API Response:', { status: response.status, errorData });
        throw new Error(errorMessage);
      }

      const data: OnDemandResponse = await response.json();
      const assistantResponse = data.data?.answer;

      if (!assistantResponse) {
        throw new Error('No response content received from API');
      }

      // Add assistant response to conversation history
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: assistantResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      this.conversationHistory.push(assistantMsg);

      return assistantResponse;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('OnDemand Chatbot Error:', errorMessage);
      throw error;
    }
  }

  /**
   * Gets the conversation history
   */
  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clears the conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Gets initial greeting message
   */
  getGreetingMessage(): string {
    return "Hi! I'm KinetiqAI Coach. I'm here to help you with posture corrections, movement guidance, and fitness tips. What would you like to know?";
  }

  /**
   * Gets suggested prompts for users
   */
  getSuggestedPrompts(): string[] {
    return [
      'How can I improve my posture?',
      'What does my posture analysis show?',
      'Give me exercise modifications',
      'How do I prevent injury during workouts?',
    ];
  }
}

// Create singleton instance
let chatbotServiceInstance: OnDemandChatbotService | null = null;

export const initializeOnDemandChatbot = (apiKey: string): OnDemandChatbotService => {
  chatbotServiceInstance = new OnDemandChatbotService(apiKey);
  return chatbotServiceInstance;
};

export const getOnDemandChatbot = (): OnDemandChatbotService => {
  if (!chatbotServiceInstance) {
    throw new Error('OnDemand Chatbot not initialized. Call initializeOnDemandChatbot first.');
  }
  return chatbotServiceInstance;
};

export { OnDemandChatbotService, ChatMessage };
