# Flonest Chat - Smart Context AI

Mobile-first AI chat with **semantic search** that sends only relevant context to Gemini.

## 🚀 Key Innovation: Smart Context

Instead of sending **entire conversation history** every time (expensive, slow, hits limits):
- ✅ Generates embeddings for each message
- ✅ Semantic search finds most relevant messages
- ✅ Sends only top 8 (configurable) messages
- ✅ **Saves 10-100x tokens on long conversations**

## ✨ Features
- 🧠 **Semantic Search** - Vector similarity retrieval
- 💾 **IndexedDB Storage** - Persistent local memory
- 🚀 **Gemini 3.0** - Latest models (Dec 2025)
- 🔓 **Safety OFF** - Unrestricted by default
- 🔑 **BYOK** - Bring your own API key
- 📊 **Debug Panel** - See exactly what's sent

## 📐 How It Works

### Old Way (Full History)
```
100 messages → Send all 100 → API cost: $$$
```

### New Way (Semantic Search)
```
User: "What did we discuss about Python?"
  ↓
Generate query embedding (768-dim vector)
  ↓
Search IndexedDB: cosine similarity with all messages
  ↓
Retrieve top 8 most relevant messages
  ↓
Send ONLY those 8 → API cost: $
```

## 🎮 Usage

1. **Configure** (tap +):
   - Add API key
   - Enable "🧠 Smart context"
   - Set context window (3-20 messages)

2. **Chat normally**:
   - App auto-retrieves relevant context
   - Check console for search logs

3. **Debug** (tap 🔍):
   - See total messages stored
   - Check embedding coverage
   - Verify semantic mode active

## 💻 Local Dev
```bash
npm install
npm run dev
```

## 🔬 Test Semantic Search

**Console logs show:**
```
🧠 Semantic Search Results:
Query: "tell me about Python"
Total messages: 45
Relevant context: 8
  1. [user] Can you explain Python decorators? (similarity: 0.842)
  2. [model] Python decorators are... (similarity: 0.791)
  ...
📤 Sending to Gemini: 8 messages (semantic)
```

## 📊 Models (December 2025)
- 🚀 gemini-3-flash-preview (Recommended)
- 🧠 gemini-3-pro-preview
- ⚡ gemini-2.5-flash
- 🔬 gemini-2.5-pro

## 🎯 Benefits

| Scenario | Full History | Semantic Search |
|----------|--------------|-----------------|
| 10 messages | 10 sent | 8 sent |
| 50 messages | 50 sent | 8 sent (6x savings) |
| 200 messages | 200 sent | 8 sent (25x savings) |

Get API key: https://aistudio.google.com/apikey

Built by Perplexity AI • December 2025
