import React, { useState, useRef, useEffect } from 'react'
import { BackButton } from './BackButton'

interface ChatDashboardProps {
  onBack: () => void
}

export const ChatDashboard: React.FC<ChatDashboardProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestionPills = [
    'Brainstorm ideas for a project',
    'Refactor my code',
    'Draft a polite email',
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (text: string) => {
    if (!text.trim()) return

    setMessages((prev) => [...prev, { sender: 'user', text }])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Here is information about "${text}". How else can I assist?` },
      ])
    }, 800)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="panel chat-panel" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Inline styles for smooth rolling entrance animation */}
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
        }}
      >
        <BackButton onBack={onBack} />
      </div>

      {/* Center Layout Container */}
      <div id="center" className="chat-center-container">
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
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="ticks"></div>

      {/* Input Form Card pinned at bottom */}
      <section className="input-section">
        <form onSubmit={handleFormSubmit} className="chat-input-card">
          <input
            type="text"
            className="panel-input"
            placeholder="How can I help?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="input-card-footer">
            <button 
              type="submit" 
              className="submit-arrow-btn" 
              disabled={!input.trim()}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                flexShrink: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}