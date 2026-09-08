import React, { useState, useRef, useEffect } from 'react'
import { chat } from '../../services/api'
import type { ChatTurn, SearchResult } from '../../services/api'
import { BackButton } from './BackButton'
import { ToggleModeButton } from './ToggleModeButton'

interface ChatDashboardProps {
  onBack: () => void
}

interface ChatMessage {
  sender: 'user' | 'ai'
  text: string
  rag?: boolean
  sources?: SearchResult[]
}

const CHAT_HISTORY_KEY = 'study-assistant-chat-history'

const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

const AssistantMessage: React.FC<{ text: string }> = ({ text }) => {
  const normalizedText = text.replace(/\s+\*\s+(?=\*\*)/g, '\n• ')
  return (
    <div className="assistant-markdown">
      {normalizedText.split('\n').map((line, index) => (
        <div key={index}>{renderInlineMarkdown(line)}</div>
      ))}
    </div>
  )
}

export const ChatDashboard: React.FC<ChatDashboardProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY)
      return saved ? JSON.parse(saved) as ChatMessage[] : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [isRagEnabled, setIsRagEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const MAX_CHARS = 2000

  const suggestionPills = [
    'Brainstorm ideas for a project',
    'Refactor my code',
    'Draft a polite email',
  ]

  // Expand horizontal screen size/window on mount
  useEffect(() => {
    // If running in an environment where window resizing is supported (like an Electron app or standalone window)
    if (window.innerWidth < 1000) {
      window.resizeTo(1000, window.innerHeight)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-12)))
  }, [messages])

  // Automatically grow and scroll textarea up to a max height
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 120) // Max height of ~120px
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  const sendMessage = async (text: string) => {
    const message = text.trim()
    if (!message || isLoading) return

    const useRag = isRagEnabled
    const history: ChatTurn[] = messages.map((item): ChatTurn => ({
      role: item.sender === 'ai' ? 'assistant' : 'user',
      content: item.text,
    })).slice(-12)
    setMessages((prev) => [...prev, { sender: 'user', text: message }])
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setIsLoading(true)
    try {
      const response = await chat(message, useRag, 5, history)
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: response.answer, rag: response.rag, sources: response.sources },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: error instanceof Error ? error.message : 'The assistant could not answer right now.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= MAX_CHARS) {
      setInput(val)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="panel chat-panel" style={{ position: 'relative', width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Inline styles for text wrapping, layout containment, and animations */}
      <style>{`
        @keyframes rollInCard {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animated-pill-1 {
          animation: rollInCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .animated-pill-2 {
          animation: rollInCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }
        .animated-pill-3 {
          animation: rollInCard 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .chat-thread-container {
          overflow-y: auto;
          overflow-x: hidden;
          width: 100%;
          box-sizing: border-box;
        }
        .chat-message {
          max-width: 100%;
          word-break: break-word;
          overflow-wrap: break-word;
          box-sizing: border-box;
        }
        .chat-ovular-input-card {
          max-width: 920px;
          margin: 0 auto;
          background: rgba(30, 30, 30, 0.7);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.15));
          border-radius: 24px;
          padding: 8px 12px 8px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: border-color 0.2s, background 0.2s;
        }
        .chat-ovular-input-card:focus-within {
          border-color: var(--accent, rgba(244, 114, 182, 0.6));
          background: rgba(35, 35, 40, 0.85);
        }
        .chat-ovular-input-card textarea {
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          resize: none;
          line-height: 20px;
          max-height: 120px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .chat-ovular-input-card textarea::-webkit-scrollbar {
          display: none;
        }
        .chat-ovular-input-card textarea::placeholder {
          color: rgba(255, 255, 255, 0.4);
          opacity: 1;
        }
        .chat-glossy-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          background: rgba(24, 24, 27, 0.60);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: var(--accent);
          border: 2px solid var(--accent-border, rgba(244, 114, 182, 0.4));
          transition: border-color 0.3s, background 0.3s, transform 0.2s, opacity 0.3s;
          cursor: pointer;
        }
        .chat-glossy-send-btn:hover {
          background: rgba(24, 24, 27, 0.60);
          border-color: var(--accent);
          transform: translateY(-1px);
        }
        .chat-glossy-send-btn:disabled {
          opacity: 0.4;
          cursor: pointer;
          transform: none;
        }
      `}</style>

      {/* Top Header Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '24px 24px 0',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        <BackButton onBack={onBack} />
        <ToggleModeButton />
      </div>

      {/* Center Layout Container */}
      <div id="center" className="chat-center-container" style={{ overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {messages.length === 0 ? (
          /* Empty State Suggestions */
          <div className="empty-state-view">
            <h2 className="ask-heading" style={{ animation: 'rollInCard 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0s both' }}>
              Ask a question
            </h2>
            <div className="pills-wrapper">
              <button
                type="button"
                className="pill-btn animated-pill-1"
                onClick={() => sendMessage(suggestionPills[0])}
              >
                {suggestionPills[0]}
              </button>
              <div className="pills-row">
                <button
                  type="button"
                  className="pill-btn animated-pill-2"
                  onClick={() => sendMessage(suggestionPills[1])}
                >
                  {suggestionPills[1]}
                </button>
                <button
                  type="button"
                  className="pill-btn animated-pill-3"
                  onClick={() => sendMessage(suggestionPills[2])}
                >
                  {suggestionPills[2]}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Dynamic Scrollable Thread */
          <div className="chat-thread-container">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                {msg.sender === 'ai' ? <AssistantMessage text={msg.text} /> : <div>{msg.text}</div>}
                {msg.sender === 'ai' && msg.rag && msg.sources && msg.sources.length > 0 && (
                  <div className="chat-source-note">
                    Grounded in {msg.sources.length} uploaded source{msg.sources.length === 1 ? '' : 's'}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="ticks"></div>

      {/* Input Form Card pinned at bottom */}
      <section className="input-section">
        <div className="chat-input-row">
          <button
            type="button"
            className={`rag-toggle ${isRagEnabled ? 'active' : ''}`}
            aria-pressed={isRagEnabled}
            onClick={() => setIsRagEnabled((enabled) => !enabled)}
            title="Ground answers in uploaded study documents"
          >
            RAG
          </button>
          <form
            onSubmit={handleFormSubmit}
            className="chat-ovular-input-card"
            onClick={() => textareaRef.current?.focus()}
            style={{ cursor: 'text' }}
          >
          <textarea
            ref={textareaRef}
            rows={1}
            className="panel-input"
            placeholder="How can I help?"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_CHARS}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              cursor: 'text',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              margin: 0,
            }}
          />

          <div className="input-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', margin: 0 }}>
            <button 
              type="submit" 
              className="chat-glossy-send-btn" 
              disabled={!input.trim() || isLoading}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                padding: 0,
                flexShrink: 0
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
          </form>
        </div>
      </section>
    </div>
  )
}