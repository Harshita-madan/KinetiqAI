# OnDemand Chatbot Integration

## Overview

The KinetiqAI app now features an integrated OnDemand ChatBot that replaces the generic chat section. This specialized fitness coach chatbot is designed exclusively for fitness and posture guidance.

## Key Features

✅ **Fitness & Posture Focused**
- Explains posture and movement issues detected by the app
- Provides fitness and exercise guidance
- Suggests exercise modifications and improvements

✅ **Safety Constraints**
- **NO** medical diagnoses or treatment advice
- **NO** health advice or medical consultations
- **NO** off-topic conversations
- Safe for beginners and elderly users

✅ **User Experience**
- Short, simple, non-medical responses (2-3 sentences max)
- No questions asked back to the user
- Actionable guidance
- Real-time responses via OnDemand API

## Architecture

### OnDemandChatbotService (`src/services/OnDemandChatbotService.ts`)

**Responsibilities:**
- Manages communication with OnDemand API
- Maintains conversation history
- Enforces strict system prompt for safety and focus
- Handles errors gracefully

**Key Methods:**
- `sendMessage(userMessage: string): Promise<string>` - Send a message and get a response
- `getConversationHistory(): ChatMessage[]` - Retrieve chat history
- `clearHistory(): void` - Clear conversation history
- `getGreetingMessage(): string` - Get initial greeting
- `getSuggestedPrompts(): string[]` - Get suggested conversation starters

**System Prompt:**
The chatbot operates under strict constraints defined in the system prompt:
1. Only explains fitness/posture/exercise guidance
2. Never provides medical advice
3. Keeps responses short and actionable
4. Redirects medical questions to healthcare professionals
5. Maintains focus on fitness topics only

### ChatScreen Integration (`src/screens/ChatScreen.tsx`)

**Changes Made:**
- Replaced demo AI responses with real OnDemand API calls
- Added loading states during API requests
- Integrated suggested prompts for fitness guidance
- Updated avatar icon from "hardware-chip" to "fitness"
- Added error handling with user-friendly messages
- Displays full conversation history

**Suggested Prompts:**
- "How can I improve my posture?"
- "What does my posture analysis show?"
- "Give me exercise modifications"
- "How do I prevent injury during workouts?"

### App.tsx Initialization

**Setup:**
- OnDemand API key is initialized when the app starts
- Chatbot is ready for use in the Chat screen
- Errors during initialization are logged (non-blocking)

```typescript
const ONDEMAND_API_KEY = 'IDhwtqWIap55xKVs4ncupNkALIOD80Gw';

useEffect(() => {
  initializeOnDemandChatbot(ONDEMAND_API_KEY);
}, []);
```

## API Configuration

**API Details:**
- **Provider:** OnDemand (on-demand.io)
- **Endpoint:** `https://api.on-demand.io/chat/completions`
- **Model:** `gpt-4o-mini`
- **Temperature:** 0.5 (focused responses)
- **Max Tokens:** 150 (limits response length)

**Authentication:**
- Uses Bearer token authentication with provided API key
- Key is passed in Authorization header

## Safety & Constraints

### System Prompt Enforcement

The chatbot operates with a strict system prompt that:

1. **Restricts Scope:**
   - Only fitness, posture, and exercise guidance
   - No medical discussions

2. **Enforces Tone:**
   - Short responses (2-3 sentences max)
   - Simple, actionable language
   - No technical jargon

3. **Maintains Safety:**
   - Redirects medical questions to healthcare professionals
   - Refuses off-topic conversations
   - Prioritizes user safety, especially for beginners/elderly

### Example Constraints

**ALLOWED:**
- "Explain my posture analysis"
- "How do I do this exercise correctly?"
- "What's a good warm-up routine?"

**FORBIDDEN:**
- Medical diagnosis: "Do I have a torn rotator cuff?"
- Health advice: "Should I take pain medication?"
- Off-topic: "What's the weather like?"

## Usage

### For Users

1. Navigate to the Chat tab in the app menu
2. See the initial greeting and suggested prompts
3. Ask fitness or posture-related questions
4. Receive actionable, safety-focused guidance

### For Developers

```typescript
import { getOnDemandChatbot, initializeOnDemandChatbot } from './src/services';

// Initialize (done in App.tsx)
initializeOnDemandChatbot('YOUR_API_KEY');

// Use the chatbot
const chatbot = getOnDemandChatbot();
const response = await chatbot.sendMessage("How can I improve my posture?");

// Access history
const history = chatbot.getConversationHistory();

// Clear history
chatbot.clearHistory();
```

## Error Handling

**Common Errors:**

| Error | Cause | Handling |
|-------|-------|----------|
| API Error 401 | Invalid API key | Check credentials in App.tsx |
| API Error 429 | Rate limit | Wait and retry |
| Network error | No connection | Show offline message |
| Empty response | API issue | Show retry message |

**User-Facing Messages:**
- Technical issues show: "I'm experiencing a technical issue. Please try again in a moment."
- Errors are logged to console for debugging

## Testing

### Test Cases

1. **Posture Guidance:**
   - "How can I improve my posture?"
   - Verify: Gets actionable posture tips

2. **Exercise Modifications:**
   - "Can you modify this exercise for beginners?"
   - Verify: Provides safe alternatives

3. **Safety Boundary:**
   - "Do I have a slipped disc?"
   - Verify: Redirects to healthcare professional

4. **Off-Topic:**
   - "Tell me a joke"
   - Verify: Redirects to fitness topics

5. **Conversation History:**
   - Send multiple messages
   - Verify: System maintains context across messages

## Future Improvements

- Add voice input/output capabilities
- Integrate with pose detection results
- Add session-specific guidance based on detected issues
- Implement rate limiting with fallback responses
- Add analytics to track common questions
- Multi-language support

## Files Modified

- `App.tsx` - Added OnDemand initialization
- `src/services/OnDemandChatbotService.ts` - New service (CREATED)
- `src/services/index.ts` - Added exports
- `src/screens/ChatScreen.tsx` - Integrated OnDemand API

## Deployment Notes

⚠️ **API Key Security:**
- The API key in `App.tsx` should be moved to environment variables for production
- Use `.env` file or build-time environment variables
- Never commit API keys to version control

```typescript
// PRODUCTION RECOMMENDATION:
const ONDEMAND_API_KEY = process.env.ONDEMAND_API_KEY || '';
```

## Support

For issues or questions:
1. Check the error messages in the console
2. Verify API key is valid in App.tsx
3. Ensure network connectivity
4. Review the system prompt for constraint details
