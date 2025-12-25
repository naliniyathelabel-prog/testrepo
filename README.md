# Flonest Chat - Semantic Memory AI

Mobile-first AI chat with persistent semantic memory powered by Gemini 2.x.

## Features
✅ **Gemini 2.5 Pro & Flash** - Latest models  
✅ **Semantic Memory** - Vector embeddings for future search  
✅ **IndexedDB Persistence** - Survives refresh/close  
✅ **Offline Storage** - Messages stored locally  
✅ **Safety OFF by default** - Unrestricted creative mode  
✅ **BYOK** - Bring your own API key  

## Models Supported
- 🧠 **gemini-2.5-pro** - Most intelligent (Mar 2025)
- ⚡ **gemini-2.5-flash** - Fast & balanced (Recommended)
- 💭 **gemini-2.0-flash-thinking** - Chain-of-thought reasoning
- **gemini-2.0-flash-exp** - Experimental features

## Architecture
```
User message → IndexedDB → Gemini API → Response
      ↓                           ↓
  Embedding                   Embedding
      ↓                           ↓
  IndexedDB ← ─ ─ ─ ─ ─ ─ → IndexedDB
              (Future: Semantic Search)
```

## Local Dev
```bash
npm install
npm run dev
```

## Storage
- **Config**: localStorage (~5 KB)
- **Messages**: IndexedDB (~50 MB+)
- **Embeddings**: 768-dimensional vectors per message

## Usage
1. Tap **+** → Enter API key (https://aistudio.google.com/apikey)
2. Select model (default: gemini-2.5-flash)
3. Toggle safety & embeddings
4. Chat - messages auto-save to IndexedDB

## Semantic Search (Coming Soon)
Embeddings are generated and stored for each message. Future update will add:
- Vector similarity search
- Contextual retrieval
- Smart memory recall

Built by Perplexity AI agent.
