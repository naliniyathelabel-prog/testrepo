import { useState, useEffect, useRef } from 'react'
import './App.css'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { openDB, saveMessage, loadMessages, loadRecentEmbeddedMessages, clearMessages } from './db'
import { getEmbedding, semanticSearch, shouldEmbedAssistant } from './embeddings'

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
    semanticMode: true, 
    contextWindow: 6, // Top K
    threshold: 0.75
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
            timestamp: m.timestamp
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
      semanticMode: config.semanticMode,
      topK: config.contextWindow,
      threshold: config.threshold
    })
    setShowDebug(true)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!config.apiKey) {
      alert('Please set your Gemini API key first (tap + button)')
      return
    }

    const currentInput = input
    setInput('')
    setLoading(true)

    // 1. Prepare User Message (DO NOT SAVE YET - Prevent Leakage)
    const userMsg = { role: 'user', text: currentInput, timestamp: Date.now() }

    // Optimistic UI update
    setMessages(prev => [...prev, userMsg])

    try {
      // 2. Generate Embedding
      let userEmbedding = null
      if (config.enableEmbeddings) {
        userEmbedding = await getEmbedding(currentInput, config.apiKey)
      }

      // 3. SEMANTIC SEARCH (Bounded V2)
      let history = []

      if (config.semanticMode && userEmbedding) {
        // Load only recent embedded candidates (Max 200)
        const candidates = await loadRecentEmbeddedMessages(200)

        // V2 Search: Score + Threshold + TopK + Time Sort
        const relevant = semanticSearch(userEmbedding, candidates, {
          topK: config.contextWindow,
          threshold: config.threshold
        })

        console.log('🧠 V2 Retrieval:', relevant.length, 'messages')
        relevant.forEach(m => console.log(`  [${m.score.toFixed(2)}] ${m.text.substring(0,40)}...`))

        history = relevant.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      } else {
        // Fallback: send recent 10 messages if no embeddings
        history = messages.slice(-10).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      }

      // 4. Gemini Call
      const genAI = new GoogleGenerativeAI(config.apiKey)
      const model = genAI.getGenerativeModel({ 
        model: config.model,
        safetySettings: config.safetyOff ? [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ] : undefined
      })

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(currentInput)
      const response = result.response.text()

      // 5. Save USER message (Post-retrieval = No Leakage)
      await saveMessage(userMsg, userEmbedding)

      // 6. Save ASSISTANT message (Selective Embedding)
      const modelMsg = { role: 'model', text: response, timestamp: Date.now() }
      setMessages(prev => [...prev, modelMsg])

      let modelEmbedding = null
      if (config.enableEmbeddings && shouldEmbedAssistant(response)) {
        console.log('✅ Embedding high-signal assistant response')
        modelEmbedding = await getEmbedding(response, config.apiKey)
      } else {
        console.log('⏩ Skipping low-signal assistant embedding')
      }

      await saveMessage(modelMsg, modelEmbedding)

    } catch (err) {
      console.error('Gemini API Error:', err)
      const errorMsg = { 
        role: 'model', 
        text: '❌ Error: ' + (err.message || 'Failed to get response.'),
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
        <span className="subtitle">V2 Production Pipeline</span>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleDebug} title="Debug info">🔍</button>
          <button className="icon-btn" onClick={handleClearChat} title="Clear all">🗑️</button>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <p>👋 Start chatting!</p>
            <p className="hint">V2 Correctness Fixes Applied</p>
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
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [model, setModel] = useState(config.model)
  const [threshold, setThreshold] = useState(config.threshold || 0.75)
  const [contextWindow, setContextWindow] = useState(config.contextWindow || 6)

  const handleSave = () => {
    onSave({ ...config, apiKey, model, threshold, contextWindow })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙️ Configuration V2</h2>

        <label>Gemini Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option value="gemini-3-flash-preview">⚡ Gemini 3 Flash</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>

        <label>API Key</label>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} />

        <div className="toggle-section">
          <label>Similarity Threshold ({threshold})</label>
          <input 
            type="range" min="0.5" max="0.95" step="0.05" 
            value={threshold} 
            onChange={e => setThreshold(parseFloat(e.target.value))} 
          />
          <p className="hint-text">Higher = stricter matching</p>
        </div>

        <div className="toggle-section">
          <label>Top K Context ({contextWindow})</label>
          <input 
            type="range" min="3" max="15" step="1" 
            value={contextWindow} 
            onChange={e => setContextWindow(parseInt(e.target.value))} 
          />
        </div>

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
        <h2>🔍 V2 Stats</h2>
        <div className="debug-grid">
          <div className="debug-item"><span>Total Msgs:</span> <strong>{info.totalMessages}</strong></div>
          <div className="debug-item"><span>Embedded:</span> <strong>{info.withEmbeddings}</strong></div>
          <div className="debug-item"><span>Top K:</span> <strong>{info.topK}</strong></div>
          <div className="debug-item"><span>Threshold:</span> <strong>{info.threshold}</strong></div>
        </div>
        <button onClick={onClose} className="btn-primary" style={{width:'100%', marginTop:'16px'}}>Close</button>
      </div>
    </div>
  )
}

export default App
