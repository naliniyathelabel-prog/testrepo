# 🗺️ AIDER-STYLE REPOMAP
**Generated:** Dec 25, 2025 | **Branch:** agent/chat-gemini-spa

## Symbol Map (Tree-sitter style)


### 📄 `src/App.jsx`
**Functions:** App() at L10, init() at L33, saveConfig() at L74, handleClearChat() at L80, handleDebug() at L87, withEmbeddings() at L89, sendMessage() at L102, ConfigModal() at L290, handleSave() at L295, DebugModal() at L338
**Hooks:** messages at L11, input at L12, config at L13, showConfig at L23, showDebug at L24, loading at L25, initializing at L26, debugInfo at L27
**Exports:** default export at L357

### 📄 `src/App.css`
**Classes:** action-btn, action-group, app, btn-primary, btn-secondary, empty, header-actions, icon-btn, input-actions, input-box, loading, message, message-role, modal, modal-actions, modal-overlay, model, send-btn, subtitle, user

### 📄 `src/db.js`
**Functions:** openDB() at L6, saveMessage() at L27, loadMessages() at L48, loadRecentEmbeddedMessages() at L62, embedded() at L76, clearMessages() at L85
**Exports:** openDB at L6, default export at L27, default export at L48, default export at L62, default export at L85

### 📄 `src/embeddings.js`
**Functions:** getEmbedding() at L3, cosineSimilarity() at L27, calculateScore() at L46, semanticSearch() at L63, scored() at L68, shouldEmbedAssistant() at L85
**Exports:** getEmbedding at L3, cosineSimilarity at L27, calculateScore at L46, semanticSearch at L63, shouldEmbedAssistant at L85

### 📄 `index.html`


## Architecture (Ranked by Importance)

### Core Files (PageRank: High)
1. **src/App.jsx** - Main component, state management, API calls
2. **src/embeddings.js** - Vector ops, semantic search, scoring
3. **src/db.js** - IndexedDB persistence layer
4. **src/App.css** - UI styling, layout, mobile responsiveness

### Entry Points
- **index.html** - Viewport config, meta tags
- **src/main.jsx** - React root mount

## Current Issue: Mobile Keyboard Behavior

### Problem
- Input bar uses `position: fixed; bottom: 0`
- Android keyboard pushes viewport, input bar stays at original bottom
- Result: Input hidden behind keyboard

### Solution (Surgical Edit)
**File:** `src/App.css`
**Target:** `.input-container` class

**Change:**
```css
/* Before */
.input-container {
  position: fixed;
  bottom: 0;
}

/* After */
.input-container {
  position: fixed;
  bottom: env(safe-area-inset-bottom); /* iOS notch */
}

/* Add viewport height fix */
.app {
  height: 100dvh; /* Dynamic viewport height - respects keyboard */
}
```

**File:** `index.html`
**Add:** `interactive-widget=resizes-content` to viewport meta

### Header Transparency
**File:** `src/App.css`
**Target:** `.header` class

**Change:**
```css
.header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari */
}
```

## Token Budget
- Total files: 9
- Symbols extracted: 47
- Lines in map: ~80
- Estimated tokens: ~600 (vs ~8000 for full files)
