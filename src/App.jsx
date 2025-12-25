import { useState, useEffect, useRef } from 'react'
import './App.css'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { openDB, saveMessage, loadMessages, clearMessages } from './db'
import { getEmbedding } from './embeddings'

const STORAGE_KEY = 'flonestChat'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [config, setConfig] = useState({
    systemPrompt: '',
    apiKey: '',
    model: 'gemini-2.5-flash',
    safetyOff: true,
    enableEmbeddings: true
  })
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const messagesEndRef = useRef(null)

  // Load config and messages on mount
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setConfig(prev => ({ ...prev, ...parsed }))
        } catch {}
      }

      // Load persisted messages from IndexedDB
      try {
        await openDB()
        const saved = await loadMessages()
        if (saved.length > 0) {
          setMessages(saved.map(m => ({ role: m.role, text: m.text, embedding: m.embedding })))
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!config.apiKey) {
      alert('Please set your Gemini API key first (tap + button)')
      return
    }

    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      // Generate embedding for user message (async, non-blocking)
      let userEmbedding = null
      if (config.enableEmbeddings) {
        userEmbedding = await getEmbedding(currentInput, config.apiKey)
      }

      // Save user message to IndexedDB
      await saveMessage(userMsg, userEmbedding)

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

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(currentInput)
      const response = result.response.text()

      const modelMsg = { role: 'model', text: response }
      setMessages(prev => [...prev, modelMsg])

      // Generate embedding for model response
      let modelEmbedding = null
      if (config.enableEmbeddings) {
        modelEmbedding = await getEmbedding(response, config.apiKey)
      }

      // Save model response to IndexedDB
      await saveMessage(modelMsg, modelEmbedding)

    } catch (err) {
      console.error('Gemini API Error:', err)
      const errorMsg = { 
        role: 'model', 
        text: '❌ Error: ' + (err.message || 'Failed to get response. Check API key and model.')
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
        <span className="subtitle">Gemini 2.x • Semantic Memory</span>
        <button className="clear-btn" onClick={handleClearChat}>🗑️</button>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <p>👋 Start chatting!</p>
            <p className="hint">Tap + to configure • Messages persist locally</p>
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
    </div>
  )
}

function ConfigModal({ config, onSave, onClose }) {
  const [systemPrompt, setSystemPrompt] = useState(config.systemPrompt)
  const [apiKey, setApiKey] = useState(config.apiKey)
  const [model, setModel] = useState(config.model)
  const [safetyOff, setSafetyOff] = useState(config.safetyOff !== false)
  const [enableEmbeddings, setEnableEmbeddings] = useState(config.enableEmbeddings !== false)

  const handleSave = () => {
    onSave({ systemPrompt, apiKey, model, safetyOff, enableEmbeddings })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙️ Configuration</h2>

        <label>System Prompt (AI behavior)</label>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant that provides clear and concise answers."
          rows={4}
        />
        <p className="hint-text">Leave empty for default behavior</p>

        <label>Gemini Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option value="gemini-2.5-flash">⚡ Gemini 2.5 Flash (Recommended)</option>
          <option value="gemini-2.5-pro">🧠 Gemini 2.5 Pro (Most Intelligent)</option>
          <option value="gemini-2.0-flash-thinking-exp">💭 Gemini 2.0 Flash Thinking</option>
          <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
        </select>

        <label>API Key (BYOK)</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="AIza..."
        />
        <p className="warning">⚠️ Stored in browser localStorage (test keys only)</p>

        <div className="safety-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={safetyOff}
              onChange={e => setSafetyOff(e.target.checked)}
            />
            <span>Turn OFF all safety filters</span>
          </label>
          <p className="hint-text">
            {safetyOff ? '✅ Unrestricted mode (BLOCK_NONE)' : '⚠️ Default safety active'}
          </p>
        </div>

        <div className="safety-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={enableEmbeddings}
              onChange={e => setEnableEmbeddings(e.target.checked)}
            />
            <span>Enable semantic memory (embeddings)</span>
          </label>
          <p className="hint-text">
            {enableEmbeddings ? '🧠 Generates embeddings for future semantic search' : '💬 Basic chat only'}
          </p>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

export default App
