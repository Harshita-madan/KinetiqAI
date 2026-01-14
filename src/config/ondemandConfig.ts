/**
 * OnDemand API Configuration
 * 
 * Official Documentation: https://docs.on-demand.io/
 */

// API Base URL (confirmed from official docs)
export const ONDEMAND_API_BASE_URL = 'https://api.on-demand.io';

// Chat API Endpoints
export const ONDEMAND_CHAT_ENDPOINTS = {
  createSession: `${ONDEMAND_API_BASE_URL}/chat/v1/sessions`,
  submitQuery: (sessionId: string) => `${ONDEMAND_API_BASE_URL}/chat/v1/sessions/${sessionId}/query`,
};

// Authentication
export const ONDEMAND_AUTH = {
  headerName: 'apikey', // Use "apikey" header, NOT "Authorization"
  headerValue: (apiKey: string) => apiKey, // Pass API key directly
};

// Configuration
export const ONDEMAND_CONFIG = {
  endpoint: 'predefined-openai-gpt4o', // Available in OnDemand Playground
  responseMode: 'sync',
};

/**
 * SETUP GUIDE:
 * 
 * 1. Go to https://app.on-demand.io/
 * 2. Log in to your account
 * 3. Navigate to "API Keys Management" (in sidebar Settings)
 * 4. Click "Create New API Key" button
 * 5. Copy the API key immediately (shown only once)
 * 6. Store it safely (use .env file in production)
 * 
 * NO DOMAIN SETUP NEEDED:
 * - The API key itself is enough
 * - No domain configuration required
 * - API key works globally
 * 
 * AUTHENTICATION HEADER:
 * ✅ Correct:  headers: { 'apikey': 'YOUR_KEY_HERE' }
 * ❌ Wrong:    headers: { 'Authorization': 'Bearer YOUR_KEY_HERE' }
 * 
 * ENDPOINT TESTED:
 * - Base URL: https://api.on-demand.io
 * - Chat Session Create: /chat/v1/sessions
 * - Submit Query: /chat/v1/sessions/{sessionId}/query
 * - Uses "apikey" header (not Authorization Bearer)
 * 
 * AVAILABLE ENDPOINTS:
 * - predefined-openai-gpt4o (default, recommended)
 * - predefined-openai-gpt4 (if GPT-4 needed)
 * - Check your account for available models
 */

