import React, { useEffect } from 'react'
import '../App.css'

interface BackButtonProps {
  onBack: () => void
  shortcutKey?: string
  title?: string
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  onBack, 
  shortcutKey = 'Escape',
  title = 'Esc' 
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === shortcutKey) {
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, shortcutKey])

  return (
    <button
      type="button"
      className="back-btn"
      onClick={onBack}
      title={title}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Slightly lighter and more visible
        border: '1px solid rgba(255, 255, 255, 0.15)', // Crisp subtle border
      }}
    >
      <div className="inner">
        <span></span>
      </div>
    </button>
  )
}