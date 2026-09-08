import React from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  title = 'Settings',
  children,
}) => {
  if (!isOpen) return null

  return (
    <div className="pomodoro-modal-overlay">
      <div className="pomodoro-modal-content">
        <h3 className="pomodoro-modal-title">{title}</h3>
        {children}
      </div>
    </div>
  )
}