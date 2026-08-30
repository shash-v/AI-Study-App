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
    >
      <div className="inner">
        <span></span>
      </div>
    </button>
  )
}