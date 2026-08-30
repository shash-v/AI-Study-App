import React from 'react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  title = 'Settings',
  children,
}) => {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(20, 20, 20, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '320px',
          color: '#ffffff',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 400 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}