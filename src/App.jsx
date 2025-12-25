import { useState, useEffect, useRef } from 'react'
import './App.css'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { openDB, saveMessage, loadMessages, clearMessages } from './db'
import { getEmbedding, cosineSimilarity } from './embeddings'

const STORAGE_KEY = 'flonestChat'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [config, setConfig] = useState({
    systemPrompt: '',
    apiKey: '',
    model: 'gemini-3-flash-preview',
    safetyOff: true,
    enableEmbeddings: true,
    semanticMode: true, // Use semantic search instead of full history
    contextWindow: 8 // Number of relevant messages to retrieve
  })
  const [showConfig, setShowConfig] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [debugInfo, setDebugInfo] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setConfig(prev => ({ ...prev, ...parsed }))
        } catch {}
      }

      try {
        await openDB()
        const saved = await loadMessages()
        if (saved.length > 0) {
          setMessages(saved.map(m => ({ 
            role: m.role, 
            text: m.text, 
            embedding: m.embedding,
            timestamp: m.timestamp,
            id: m.id
          })))
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
      }

      setInitializing(false)
    }
    init()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveConfig = (newConfig) => {
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    setShowConfig(false)
  }

  const handleClearChat = async () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      await clearMessages()
      setMessages([])
    }
  }

  const handleDebug = async () => {
    const stored = await loadMessages()
    const withEmbeddings = stored.filter(m => m.embedding && m.embedding.length > 0)

    setDebugInfo({
      totalMessages: stored.length,
      withEmbeddings: withEmbeddings.length,
      storageSize: new Blob([JSON.stringify(stored)]).size,
      embeddingDim: withEmbeddings[0]?.embedding?.length || 0,
      semanticMode: config.semanticMode,
      contextWindow: config.contextWindow
    })
    setShowDebug(true)
  }

  const getRelevantContext = async (query, queryEmbedding) => {
    if (!config.semanticMode || !queryEmbedding) {
      // Fallback: return all messages (old behavior)
      return messages
    }

    // Semantic search: find most relevant messages
    const scored = messages
      .filter(m => m.embedding && m.embedding.length > 0)
      .map(m => ({
        ...m,
        similarity: cosineSimilarity(queryEmbedding, m.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, config.contextWindow)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)) // Re-sort by time

    console.log('🧠 Semantic Search Results:')
    console.log(`Query: "${query}"`)
    console.log(`Total messages: ${messages.length}`)
    console.log(`Relevant context: ${scored.length}`)
    scored.forEach((m, i) => {
      console.log(`  ${i+1}. [${m.role}] ${m.text.substring(0, 50)}... (similarity: ${m.similarity.toFixed(3)})`)
    })

    return scored
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!config.apiKey) {
      alert('Please set your Gemini API key first (tap + button)')
      return
    }

    const userMsg = { role: 'user', text: input, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      // Generate embedding for user message
      let userEmbedding = null
      if (config.enableEmbeddings) {
        userEmbedding = await getEmbedding(currentInput, config.apiKey)
      }

      await saveMessage(userMsg, userEmbedding)

      // Get relevant context using semantic search
      const relevantMessages = await getRelevantContext(currentInput, userEmbedding)

      const genAI = new GoogleGenerativeAI(config.apiKey)

      const modelConfig = { model: config.model }

      if (config.systemPrompt && config.systemPrompt.trim()) {
        modelConfig.systemInstruction = config.systemPrompt.trim()
      }

      if (config.safetyOff) {
        modelConfig.safetySettings = [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      }

      const model = genAI.getGenerativeModel(modelConfig)

      // Use relevant context instead of full history
      const history = relevantMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))

      console.log(`📤 Sending to Gemini: ${history.length} messages (${config.semanticMode ? 'semantic' : 'full history'})`)

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(currentInput)
      const response = result.response.text()

      const modelMsg = { role: 'model', text: response, timestamp: Date.now() }
      setMessages(prev => [...prev, modelMsg])

      // Generate embedding for model response
      let modelEmbedding = null
      if (config.enableEmbeddings) {
        modelEmbedding = await getEmbedding(response, config.apiKey)
      }

      await saveMessage(modelMsg, modelEmbedding)

    } catch (err) {
      console.error('Gemini API Error:', err)
      const errorMsg = { 
        role: 'model', 
        text: '❌ Error: ' + (err.message || 'Failed to get response. Check API key and model.'),
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMsg])
      await saveMessage(errorMsg, null)
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💬 Flonest Chat</h1>
        <span className="subtitle">
          {config.semanticMode ? '🧠 Smart Context' : '📜 Full History'} • Gemini 3.0
        </span>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleDebug} title="Debug info">🔍</button>
          <button className="icon-btn" onClick={handleClearChat} title="Clear all">🗑️</button>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <p>👋 Start chatting!</p>
            <p className="hint">
              {config.semanticMode 
                ? '🧠 Semantic search enabled - only relevant context sent'
                : '📜 Full history mode - all messages sent'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="message model">
            <div className="bubble loading">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-bar">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          ➤
        </button>
      </div>

      <button className="fab" onClick={() => setShowConfig(true)}>
        +
      </button>

      {showConfig && (
        <ConfigModal 
          config={config} 
          onSave={saveConfig} 
          onClose={() => setShowConfig(false)} 
        />
      )}

      {showDebug && debugInfo && (
        <DebugModal 
          info={debugInfo}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  )
}

function ConfigModal({ config, onSave, onClose }) {
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [model, setModel] = useState(config.model)
  const [safetyOff, setSafetyOff] = useState(config.safetyOff !== false)
  const [enableEmbeddings, setEnableEmbeddings] = useState(config.enableEmbeddings !== false)
  const [semanticMode, setSemanticMode] = useState(config.semanticMode !== false)
  const [contextWindow, setContextWindow] = useState(config.contextWindow || 8)

  const handleSave = () => {
    onSave({ systemPrompt, apiKey, model, safetyOff, enableEmbeddings, semanticMode, contextWindow })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙️ Configuration</h2>

        <label>System Prompt</label>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="e.g., Act as assistant"
          rows={3}
        />
        <p className="hint-text">Optional - Define AI behavior</p>

        <label>Gemini Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}>
          <optgroup label="🚀 Gemini 3.0 (Latest)">
            <option value="gemini-3-flash-preview">⚡ Gemini 3 Flash</option>
            <option value="gemini-3-pro-preview">🧠 Gemini 3 Pro</option>
          </optgroup>
          <optgroup label="Gemini 2.5">
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </optgroup>
        </select>

        <label>API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="AIza..."
        />
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="api-link">
          Get API key →
        </a>

        <div className="toggle-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={safetyOff}
              onChange={e => setSafetyOff(e.target.checked)}
            />
            <span>Turn OFF all safety filters</span>
          </label>
        </div>

        <div className="toggle-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={enableEmbeddings}
              onChange={e => setEnableEmbeddings(e.target.checked)}
            />
            <span>Enable semantic memory</span>
          </label>
        </div>

        <div className="toggle-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={semanticMode}
              onChange={e => setSemanticMode(e.target.checked)}
            />
            <span>🧠 Smart context (semantic search)</span>
          </label>
          <p className="hint-text">
            {semanticMode 
              ? '✅ Sends only relevant messages (saves tokens)' 
              : '📜 Sends full history every time'}
          </p>
        </div>

        {semanticMode && (
          <div>
            <label>Context window (messages to retrieve)</label>
            <input
              type="range"
              min="3"
              max="20"
              value={contextWindow}
              onChange={e => setContextWindow(parseInt(e.target.value))}
            />
            <p className="hint-text">Current: {contextWindow} most relevant messages</p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

function DebugModal({ info, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal debug-modal" onClick={e => e.stopPropagation()}>
        <h2>🔍 Debug Info</h2>

        <div className="debug-grid">
          <div className="debug-item">
            <span className="debug-label">Total Messages</span>
            <span className="debug-value">{info.totalMessages}</span>
          </div>

          <div className="debug-item">
            <span className="debug-label">With Embeddings</span>
            <span className="debug-value">{info.withEmbeddings}</span>
          </div>

          <div className="debug-item">
            <span className="debug-label">Storage Size</span>
            <span className="debug-value">{(info.storageSize / 1024).toFixed(1)} KB</span>
          </div>

          <div className="debug-item">
            <span className="debug-label">Embedding Dimension</span>
            <span className="debug-value">{info.embeddingDim}</span>
          </div>

          <div className="debug-item">
            <span className="debug-label">Mode</span>
            <span className="debug-value">
              {info.semanticMode ? '🧠 Semantic' : '📜 Full History'}
            </span>
          </div>

          <div className="debug-item">
            <span className="debug-label">Context Window</span>
            <span className="debug-value">{info.contextWindow} msgs</span>
          </div>
        </div>

        <div className="debug-explanation">
          <h3>💡 How it works</h3>
          <p>
            {info.semanticMode 
              ? `When you send a message, the app retrieves the ${info.contextWindow} most semantically similar messages from your history (using vector embeddings) and sends ONLY those to Gemini. This saves tokens and stays within context limits.`
              : 'Currently sending full conversation history to Gemini. Enable semantic mode to save tokens and improve performance.'}
          </p>

          <p><strong>Check browser console for detailed logs.</strong></p>
        </div>

        <button onClick={onClose} className="btn-primary" style={{width: '100%', marginTop: '16px'}}>
          Close
        </button>
      </div>
    </div>
  )
}

export default App
