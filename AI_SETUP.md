# AI Provider Setup for Trip Planner

Your Trip Planner application requires an AI provider to generate itineraries. Here are your options:

## Option 1: Google AI Studio (Recommended - Free Tier Available)

1. Visit https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to your `.env` file:
   ```
   GOOGLE_AI_API_KEY="your-google-ai-api-key-here"
   ```

## Option 2: OpenAI (Paid)

1. Visit https://platform.openai.com/api-keys
2. Create an account or sign in
3. Create a new API key
4. Replace the placeholder in your `.env` file:
   ```
   OPENAI_API_KEY="your-actual-openai-api-key"
   ```

## Option 3: Ollama (Free - Runs Locally)

1. Install Ollama from https://ollama.com
2. Open terminal and run:
   ```bash
   ollama pull llama3.2
   ```
3. No API key needed - it runs on your computer

## Option 4: Anthropic Claude (Paid)

1. Visit https://console.anthropic.com
2. Create an account and get API key
3. Add to your `.env` file:
   ```
   ANTHROPIC_API_KEY="your-anthropic-api-key"
   ```

## After Setup

Once you've configured at least one provider, run:
```bash
npm start
```

The application will automatically use the best available provider.
