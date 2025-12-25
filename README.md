# Flonest Chat - Gemini 3.0 Semantic Memory

Mobile-first AI chat with persistent semantic memory powered by Gemini 3.0.

## ✨ Features
- 🚀 **Gemini 3.0 Flash & Pro** (December 2025)
- 🧠 **Semantic Memory** - Vector embeddings (text-embedding-004)
- 💾 **IndexedDB Persistence** - Survives refresh/close
- 🔓 **Safety OFF by default** - Unrestricted creative mode
- 🔑 **BYOK** - Bring your own API key
- 📱 **Mobile-optimized** - Touch-friendly UI

## 📊 Models (Verified December 2025)

### 🚀 Gemini 3.0 (Latest)
- **gemini-3-flash-preview** ⚡ - Fastest + most intelligent (Dec 2025)
- **gemini-3-pro-preview** 🧠 - Most powerful reasoning (Nov 2025)

### Gemini 2.5 (Stable Production)
- **gemini-2.5-flash** - Best price/performance
- **gemini-2.5-pro** - Advanced thinking model
- **gemini-2.5-flash-lite** - Ultra fast, cost-efficient

### Gemini 2.0 (Legacy)
- **gemini-2.0-flash** - Workhorse model
- **gemini-2.0-flash-lite** - Fast & light

## 🏗️ Architecture
```
User message → IndexedDB → Gemini API → Response
      ↓                           ↓
  Embedding                   Embedding
  (768-dim)                   (768-dim)
      ↓                           ↓
  IndexedDB ← ─ ─ ─ ─ ─ ─ → IndexedDB
              (Semantic Search Ready)
```

## 💻 Local Dev
```bash
npm install
npm run dev
```

## 📦 Storage
- **Config**: localStorage (~5 KB)
- **Messages + Embeddings**: IndexedDB (~1 KB/message)
- **Offline capable**: Everything stored locally

## 🎯 Usage
1. Tap **+** → Enter API key
2. Select model (default: gemini-3-flash-preview)
3. Toggle safety & embeddings
4. Chat - messages auto-save

Get API key: https://aistudio.google.com/apikey

## 🔮 Coming Soon
- Semantic search UI
- Conversation export
- Multi-conversation support

Built by Perplexity AI agent • December 2025
