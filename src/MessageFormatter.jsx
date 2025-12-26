import { useEffect, useRef } from 'react'
import { marked } from 'marked'

// Configure marked for better rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
  headerIds: false,
  mangle: false
})

/**
 * Format message text with markdown support
 * @param {string} text - Raw message text
 * @returns {Object} Formatted content with type
 */
export function formatMessageText(text) {
  if (!text) return { type: 'text', content: '' }

  // Check if text contains markdown patterns
  const hasMarkdown = /[*_`#\[\]|]|\n\n/.test(text)

  if (hasMarkdown) {
    try {
      const html = marked.parse(text)
      return { type: 'markdown', content: html }
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return { type: 'text', content: text }
    }
  }

  return { type: 'text', content: text }
}

/**
 * MessageContent component with markdown rendering
 */
export function MessageContent({ text, className = '' }) {
  const contentRef = useRef(null)

  useEffect(() => {
    if (contentRef.current) {
      // Add click handler for links
      const links = contentRef.current.querySelectorAll('a')
      links.forEach(link => {
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      })
    }
  }, [text])

  const formatted = formatMessageText(text)

  if (formatted.type === 'markdown') {
    return (
      <div 
        ref={contentRef}
        className={`message-content markdown ${className}`}
        dangerouslySetInnerHTML={{ __html: formatted.content }}
      />
    )
  }

  // Plain text with proper line breaks
  return (
    <div className={`message-content plain ${className}`}>
      {text.split('\n').map((line, i) => (
        <span key={i}>
          {line}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      ))}
    </div>
  )
}

/**
 * Code block component with syntax highlighting styles
 */
export function CodeBlock({ code, language = '' }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language || 'code'}</span>
        <button className="copy-btn" onClick={handleCopy}>Copy</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}
