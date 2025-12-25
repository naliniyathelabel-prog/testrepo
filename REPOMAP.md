# 🗺️ REPOMAP - Flonest Chat

**Repository:** naliniyathelabel-prog/testrepo  
**Branch:** agent/chat-gemini-spa  
**Generated:** December 25, 2025  

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Flonest Chat App                        │
│                  (Gemini 3.0 • Semantic Memory)             │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐          ┌──────▼────────┐
        │  React Frontend │          │  Data Layer   │
        │  (src/App.jsx)  │◄────────►│ (IndexedDB)   │
        └───────┬────────┘          └──────┬────────┘
                │                           │
    ┌───────────┼───────────┐              │
    │           │           │              │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐    ┌────▼─────┐
│Config  │ │Message │ │Debug   │    │Embeddings│
│Modal   │ │List    │ │Panel   │    │ (768-dim)│
└────────┘ └────────┘ └────────┘    └──────────┘
                                           │
                            ┌──────────────┴────────────┐
                            │                           │
                    ┌───────▼────────┐          ┌──────▼────────┐
                    │  Gemini API    │          │ Vector Search │
                    │ (Chat & Embed) │          │(Cosine Simil.)│
                    └────────────────┘          └───────────────┘
```

---

## 📂 File Structure


### 📄 `package.json`
**Size:** 0.4 KB | **Lines:** 20

**Purpose:** Dependencies: React 18, Vite 6, @google/generative-ai

### 📄 `vite.config.js`
**Size:** 0.2 KB | **Lines:** 7

**Dependencies:**
- `import { defineConfig } from 'vite'`
- `import react from '@vitejs/plugin-react'`

**Purpose:** Vite configuration with React plugin, dev server on port 3000

### 📄 `index.html`
**Size:** 0.5 KB | **Lines:** 17

**Purpose:** Entry HTML file, meta viewport for mobile, loads main.jsx

### 📄 `src/main.jsx`
**Size:** 0.2 KB | **Lines:** 10

**Dependencies:**
- `import React from 'react'`
- `import ReactDOM from 'react-dom/client'`
- `import App from './App'`
- `import './index.css'`

**Purpose:** React app entry point, renders App component

### 📄 `src/App.jsx`
**Size:** 14.8 KB | **Lines:** 455

**Dependencies:**
- `import { useState, useEffect, useRef } from 'react'`
- `import './App.css'`
- `import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'`
- `import { openDB, saveMessage, loadMessages, clearMessages } from './db'`
- `import { getEmbedding, cosineSimilarity } from './embeddings'`

**React Components:**
- `ConfigModal()`
- `DebugModal()`
- `App()`

**Key Functions:**
- `handleDebug()`
- `handleSave()`
- `saveConfig()`
- `getRelevantContext()`
- `handleClearChat()`
- `history()`
- `ConfigModal()`
- `sendMessage()`
- ... and 4 more

**Purpose:** **MAIN APP LOGIC** - Chat UI, semantic search, IndexedDB integration, Gemini API calls

### 📄 `src/App.css`
**Size:** 4.9 KB | **Lines:** 77

**Purpose:** Complete styling: mobile-first, gradients, modal overlays, animations

### 📄 `src/db.js`
**Size:** 2.4 KB | **Lines:** 79

**Purpose:** IndexedDB utilities: openDB, saveMessage, loadMessages, clearMessages

### 📄 `src/embeddings.js`
**Size:** 1.5 KB | **Lines:** 55

**Purpose:** Vector operations: getEmbedding (Gemini API), cosineSimilarity, semanticSearch

### 📄 `src/index.css`
**Size:** 0.2 KB | **Lines:** 3

**Purpose:** Global CSS reset and base styles

### 📄 `README.md`
**Size:** 2.3 KB | **Lines:** 93

**Purpose:** Documentation: features, architecture, usage, API models


---

## 🔄 Data Flow

### 1. **Message Send Flow**
```
User types message
    ↓
App.jsx: sendMessage()
    ↓
Generate embedding via embeddings.js:getEmbedding()
    ↓
Store in IndexedDB via db.js:saveMessage()
    ↓
Semantic search: getRelevantContext()
    ↓
Calculate similarities via embeddings.js:cosineSimilarity()
    ↓
Retrieve top N relevant messages
    ↓
Send context to Gemini API (@google/generative-ai)
    ↓
Receive response
    ↓
Generate response embedding
    ↓
Store response in IndexedDB
    ↓
Update UI (React state)
```

### 2. **Semantic Search Flow**
```
Query: "What did we discuss about X?"
    ↓
getEmbedding(query) → [0.023, -0.041, ...]
    ↓
loadMessages() from IndexedDB
    ↓
For each message with embedding:
    similarity = cosineSimilarity(queryEmbed, msgEmbed)
    ↓
Sort by similarity (highest first)
    ↓
Take top 8 (configurable)
    ↓
Re-sort by timestamp (chronological context)
    ↓
Return relevant messages only
```

---

## 🧩 Component Hierarchy

```
<App>
  ├── <header>
  │   ├── Title: "💬 Flonest Chat"
  │   ├── Subtitle: Mode indicator
  │   └── Actions: [🔍 Debug, 🗑️ Clear]
  │
  ├── <div.messages>
  │   ├── Empty state (if no messages)
  │   ├── Message bubbles (map)
  │   └── Loading indicator
  │
  ├── <div.input-bar>
  │   ├── <input> (message input)
  │   └── <button> (send)
  │
  ├── <button.fab> (+ config)
  │
  ├── {showConfig && <ConfigModal>}
  │   ├── System Prompt (textarea)
  │   ├── Model Select (dropdown)
  │   ├── API Key (password input)
  │   ├── Safety Toggle (checkbox)
  │   ├── Embeddings Toggle (checkbox)
  │   ├── Semantic Mode Toggle (checkbox)
  │   ├── Context Window (slider)
  │   └── Actions: [Cancel, Save]
  │
  └── {showDebug && <DebugModal>}
      ├── Debug Grid (stats)
      ├── Explanation
      └── Close button
```

---

## 🔑 Key Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI framework | 18.3.1 |
| **Vite** | Build tool & dev server | 6.0.3 |
| **@google/generative-ai** | Gemini API SDK | 0.21.0 |
| **IndexedDB** | Local persistent storage | Native browser API |
| **text-embedding-004** | Vector embeddings | Gemini API |

---

## 📊 Storage Schema

### IndexedDB: `FlonestChat`

**Object Store:** `messages`
```javascript
{
  id: number (auto-increment),
  role: 'user' | 'model',
  text: string,
  embedding: number[] | null, // 768-dimensional vector
  conversationId: string,      // Default: 'default'
  timestamp: number            // Date.now()
}
```

**Indexes:**
- `timestamp` (non-unique)
- `conversationId` (non-unique)

### LocalStorage: `flonestChat`
```javascript
{
  systemPrompt: string,
  apiKey: string,
  model: string,
  safetyOff: boolean,
  enableEmbeddings: boolean,
  semanticMode: boolean,
  contextWindow: number
}
```

---

## 🎯 Configuration Options

### Models (December 2025)
- `gemini-3-flash-preview` ⚡ (Default)
- `gemini-3-pro-preview` 🧠
- `gemini-2.5-flash`
- `gemini-2.5-pro`

### Safety Settings
When `safetyOff: true` (default):
```javascript
{
  HARM_CATEGORY_HARASSMENT: BLOCK_NONE,
  HARM_CATEGORY_HATE_SPEECH: BLOCK_NONE,
  HARM_CATEGORY_SEXUALLY_EXPLICIT: BLOCK_NONE,
  HARM_CATEGORY_DANGEROUS_CONTENT: BLOCK_NONE
}
```

### Context Window
- Range: 3-20 messages
- Default: 8 messages
- Only applies when `semanticMode: true`

---

## 🚀 Deployment

**Platform:** Vercel  
**Build Command:** `npm run build`  
**Output Directory:** `dist/`  
**Framework Preset:** Vite  

**Branch:** `agent/chat-gemini-spa`  
**Auto-deploy:** Enabled on push

---

## 📝 API Endpoints Used

### Gemini API
1. **Chat Completion:**
   ```
   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   Headers: x-goog-api-key
   ```

2. **Embeddings:**
   ```
   POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
   Headers: x-goog-api-key
   Body: { content: { parts: [{ text }] } }
   ```

---

## 🔮 Future Enhancements

- [ ] Multi-conversation support (conversation tabs)
- [ ] Export/import conversations
- [ ] Markdown rendering in responses
- [ ] Code syntax highlighting
- [ ] Voice input/output
- [ ] Conversation search UI (semantic query input)
- [ ] Token usage tracking
- [ ] Cost calculator
- [ ] Response streaming
- [ ] Image attachment support

---

**Generated by:** Perplexity AI Agent  
**Date:** December 25, 2025  
**Repository:** https://github.com/naliniyathelabel-prog/testrepo
