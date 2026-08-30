import React, { useState, useRef, useEffect } from 'react'

interface ChatDashboardProps {
  onBack: () => void
}

export const ChatDashboard: React.FC<ChatDashboardProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestionPills = [
    'Brainstorm names for my new project',
    'Refactor this component for better performance',
    'Draft a polite email asking for code review',
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
    <div className="panel chat-panel">
      {/* Top Header */}
      <header className="panel-header">
        <button type="button" className="header-back-btn" onClick={onBack}>
          ←
        </button>
      </header>

      {/* Center Layout Container */}
      <div id="center" className="chat-center-container">
        {messages.length === 0 ? (
          /* Empty State Suggestions */
          <div className="empty-state-view">
            <h2 className="ask-heading">Ask a question</h2>
            <div className="pills-wrapper">
              <button
                type="button"
                className="pill-btn"
                onClick={() => sendMessage(suggestionPills[0])}
              >
                {suggestionPills[0]}
              </button>
              <div className="pills-row">
                <button
                  type="button"
                  className="pill-btn"
                  onClick={() => sendMessage(suggestionPills[1])}
                >
                  {suggestionPills[1]}
                </button>
                <button
                  type="button"
                  className="pill-btn"
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
            placeholder="How can we help?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="input-card-footer">
            <button type="submit" className="submit-arrow-btn" disabled={!input.trim()}>
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