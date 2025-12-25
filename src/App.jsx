import { useState, useEffect, useRef } from 'react'
import './App.css'
import { GoogleGenerativeAI } from '@google/generative-ai'

const STORAGE_KEY = 'flonestChat'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [config, setConfig] = useState({
    systemPrompt: '',
    apiKey: '',
    model: 'gemini-2.0-flash-exp'
  })
  const [showConfig, setShowConfig] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setConfig(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveConfig = (newConfig) => {
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
    setShowConfig(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    if (!config.apiKey) {
      alert('Please set your Gemini API key first (tap + button)')
      return
    }

    const userMsg = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const genAI = new GoogleGenerativeAI(config.apiKey)
      const model = genAI.getGenerativeModel({ model: config.model })

      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))

      const chat = model.startChat({
        history,
        systemInstruction: config.systemPrompt || undefined
      })

      const result = await chat.sendMessage(input)
      const response = result.response.text()

      setMessages(prev => [...prev, { role: 'model', text: response }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '❌ Error: ' + (err.message || 'Failed to get response')
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>💬 Flonest Chat</h1>
        <span className="subtitle">Powered by Gemini</span>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <p>👋 Start chatting!</p>
            <p className="hint">Tap + to configure your AI assistant</p>
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

  const handleSave = () => {
    onSave({ systemPrompt, apiKey, model })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙️ Configuration</h2>

        <label>System Prompt (AI behavior)</label>
        <textarea
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant..."
          rows={4}
        />

        <label>Gemini Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Fastest)</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
        </select>

        <label>API Key (BYOK)</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="AIza..."
        />
        <p className="warning">⚠️ Stored in browser localStorage (test keys only)</p>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save</button>
        </div>
      </div>
    </div>
  )
}

export default App
