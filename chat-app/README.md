# Flonest Chat - Gemini BYOK

Mobile-first chat interface powered by Google Gemini AI.

## Features
✅ **BYOK (Bring Your Own Key)** - No backend, pure client-side  
✅ **System prompts** - Configure AI behavior  
✅ **Model selection** - Gemini 2.0 Flash, 1.5 Flash, 1.5 Pro  
✅ **Browser storage** - Persists config in localStorage  
✅ **Mobile-optimized** - Touch-friendly UI  

## Local Development
```bash
cd chat-app
npm install
npm run dev
```

## Deploy
```bash
npm run build
# Deploy dist/ to Vercel/Netlify
```

## Security Notice
⚠️ API keys are stored in browser localStorage (test keys only recommended)

## Configuration
Tap the **+** button to:
1. Set system prompt (AI personality)
2. Choose Gemini model
3. Enter your Gemini API key (get from https://aistudio.google.com/apikey)
