# OnDemand Chatbot Setup Guide

## Error You Were Getting
```
Chat Error: OnDemand Chatbot not initialized. Call initializeOnDemandChatbot first.
```

## Why This Happened
The OnDemand Chatbot service requires initialization with an API key before it can be used. The app was trying to access the chatbot without initializing it first.

## Solution - 3 Simple Steps

### Step 1: Get Your API Key
1. Go to **https://app.on-demand.io/**
2. Log in to your account (create one if needed)
3. Navigate to **"API Keys Management"** (in the sidebar under Settings)
4. Click **"Create New API Key"** button
5. **Copy the API key immediately** (it's only shown once!)
6. Save it somewhere safe

### Step 2: Add API Key to Your App
Open `App.tsx` and replace this line:
```typescript
const ONDEMAND_API_KEY = 'YOUR_API_KEY_HERE';
```

With your actual API key:
```typescript
const ONDEMAND_API_KEY = 'sk_xxxxxxxxxxxxxxxxxxxx';
```

**For production/deployment**, use environment variables instead:
```typescript
const ONDEMAND_API_KEY = process.env.EXPO_PUBLIC_ONDEMAND_API_KEY || '';
```

Then add to your `.env` file:
```
EXPO_PUBLIC_ONDEMAND_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Your App
After adding the API key, restart the app completely. You should see in the console:
```
OnDemand Chatbot initialized successfully
```

## How It Works Now

### Initialization Flow:
1. **App starts** → `App.tsx` runs `useEffect`
2. **API key is checked** → If valid, `initializeOnDemandChatbot()` is called
3. **Service instance created** → Global singleton ready to use
4. **User navigates to Chat** → `ChatScreen.tsx` can now call `getOnDemandChatbot()`
5. **Messages sent successfully** → No more initialization errors!

### What Changed:
- ✅ `App.tsx` - Now initializes the chatbot service on app startup
- ✅ `ChatScreen.tsx` - Better error handling for initialization issues
- ✅ Proper singleton pattern - Service is created once and reused

## Troubleshooting

### Still Getting the Error?
1. **Check API key is set** in `App.tsx` (not `YOUR_API_KEY_HERE`)
2. **Restart app completely** (not just reload - full close and reopen)
3. **Check browser console** for initialization log message
4. **Verify API key is valid** - Try creating a new one at https://app.on-demand.io/

### API Connection Issues?
- Check your internet connection
- Verify the API key is correct
- Check the OnDemand service status (their website)
- Look at console errors for specific API error codes

### Chat Responses Not Working?
- Ensure you selected the `predefined-openai-gpt4o` endpoint in OnDemand dashboard
- Verify your account has sufficient credits/quota
- Check the system prompt in `OnDemandChatbotService.ts` is appropriate

## Important Notes

**Security:**
- Never commit your API key directly to git
- Always use environment variables in production
- Keep your API key secret!

**Rate Limits:**
- Check OnDemand documentation for rate limits
- Consider implementing retry logic if needed
- Monitor your quota usage in the dashboard

**Testing:**
- Test with simple fitness-related questions first
- The service is configured to refuse medical questions
- Keep responses focused on exercise and posture guidance

## References
- OnDemand Docs: https://docs.on-demand.io/
- OnDemand Dashboard: https://app.on-demand.io/
- API Reference: https://docs.on-demand.io/docs/chat-api
