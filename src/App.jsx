import { useState, useEffect, useRef } from 'react'
import './App.css'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { openDB, saveMessage, loadMessages, loadRecentEmbeddedMessages, clearMessages } from './db'
import { getEmbedding, semanticSearch, shouldEmbedAssistant } from './embeddings'
import { Send, Plus, Search, Mic, Settings, Trash2, Info, X } from 'lucide-react'

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
    contextWindow: 6,
    threshold: 0.75
  })
  const [showConfig, setShowConfig] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [debugInfo, setDebugInfo] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

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
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

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
      alert('Please set your Gemini API key first (tap Settings)')
      return
    }

    const currentInput = input
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setLoading(true)

    // 1. Prepare User Message (Optimistic)
    const userMsg = { role: 'user', text: currentInput, timestamp: Date.now() }
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
        const candidates = await loadRecentEmbeddedMessages(200)
        const relevant = semanticSearch(userEmbedding, candidates, {
          topK: config.contextWindow,
          threshold: config.threshold
        })
        console.log('🧠 V2 Retrieval:', relevant.length, 'messages')

        history = relevant.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      } else {
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

      // 5. Save USER message (Post-retrieval)
      await saveMessage(userMsg, userEmbedding)

      // 6. Save ASSISTANT message
      const modelMsg = { role: 'model', text: response, timestamp: Date.now() }
      setMessages(prev => [...prev, modelMsg])

      let modelEmbedding = null
      if (config.enableEmbeddings && shouldEmbedAssistant(response)) {
        modelEmbedding = await getEmbedding(response, config.apiKey)
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

  if (initializing) return null

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Flonest</h1>
          <span className="subtitle">{config.model.split('-')[1]} • V2 Pipeline</span>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={handleDebug} title="Debug info"><Info size={20} /></button>
          <button className="icon-btn" onClick={handleClearChat} title="Clear chat"><Trash2 size={20} /></button>
          <button className="icon-btn" onClick={() => setShowConfig(true)} title="Settings"><Settings size={20} /></button>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <h2>Where knowledge begins</h2>
            <p>Ask anything • Powered by Gemini 3.0</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="message-role">{msg.role === 'user' ? 'You' : 'Flonest'}</span>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="message model">
            <span className="message-role">Flonest</span>
            <div className="bubble loading">
              <span>Thinking</span>
              <span style={{animation: 'pulse 1s infinite'}}>.</span>
              <span style={{animation: 'pulse 1s infinite 0.2s'}}>.</span>
              <span style={{animation: 'pulse 1s infinite 0.4s'}}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <div className="input-box">
          <textarea
            ref={textareaRef}
            className="input-textarea"
            placeholder="Ask follow-up..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            rows={1}
            disabled={loading}
          />
          <div className="input-actions">
            <div className="action-group">
              <button className="action-btn" title="Attach"><Plus size={20} /></button>
              <button className="action-btn" title="Focus"><Search size={20} /></button>
            </div>
            <div className="action-group">
               <button className="action-btn" title="Voice"><Mic size={20} /></button>
               <button 
                className="send-btn" 
                onClick={sendMessage} 
                disabled={!input.trim() || loading}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

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

  const handleSave = () => {
    onSave({ ...config, apiKey, model, threshold })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <label>Gemini Model</label>
        <select value={model} onChange={e => setModel(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'16px', borderRadius:'8px', border:'1px solid #ddd'}}>
          <option value="gemini-3-flash-preview">⚡ Gemini 3 Flash</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
        </select>

        <label>API Key</label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={e => setApiKey(e.target.value)}
          style={{width:'100%', padding:'10px', marginBottom:'16px', borderRadius:'8px', border:'1px solid #ddd'}}
        />

        <label>Similarity Threshold ({threshold})</label>
        <input 
          type="range" min="0.5" max="0.95" step="0.05" 
          value={threshold} 
          onChange={e => setThreshold(parseFloat(e.target.value))} 
          style={{width:'100%', marginBottom:'24px'}}
        />

        <div className="modal-actions">
          <button onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  )
}

function DebugModal({ info, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
          <h2>Debug Stats</h2>
          <button className="icon-btn" onClick={onClose}><X size={20}/></button>
        </div>
        <div style={{background:'#f8f9fa', padding:'16px', borderRadius:'8px'}}>
          <p><strong>Total Msgs:</strong> {info.totalMessages}</p>
          <p><strong>Embedded:</strong> {info.withEmbeddings}</p>
          <p><strong>Size:</strong> {(info.storageSize/1024).toFixed(1)} KB</p>
          <p><strong>Threshold:</strong> {info.threshold}</p>
        </div>
      </div>
    </div>
  )
}

export default App
