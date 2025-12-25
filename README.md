# Flonest Chat - Gemini BYOK

Mobile-first AI chat interface powered by Google Gemini.

## Features
✅ **BYOK (Bring Your Own Key)** - Client-side only  
✅ **Gemini 2.5 Flash** - Latest model (recommended)  
✅ **System prompts** - Configure AI behavior  
✅ **Safety OFF by default** - Unrestricted creative mode  
✅ **Browser storage** - Persists in localStorage  
✅ **Mobile-optimized** - Touch-friendly UI  

## Models Supported
- gemini-2.5-flash (⚡ Recommended)
- gemini-2.0-flash-exp
- gemini-1.5-flash
- gemini-1.5-pro

## Local Dev
```bash
npm install
npm run dev
```

## Deploy
```bash
npm run build
# Vercel/Netlify auto-deploys from root
```

## Usage
1. Tap **+** button
2. Enter your Gemini API key (https://aistudio.google.com/apikey)
3. Select model (default: gemini-2.5-flash)
4. Toggle safety filters (default: OFF)
5. Chat freely

⚠️ Keys stored in browser localStorage (test keys only)

## Note on Vertex AI
For enterprise features (service accounts, data residency, ADC), you'll need a backend proxy to call Vertex AI. This app uses Gemini API (BYOK) for pure client-side usage.
