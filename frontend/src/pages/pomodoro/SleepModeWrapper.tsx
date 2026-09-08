import React from 'react'
import ReactDOM from 'react-dom'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface SleepModeWrapperProps {
  isSleepMode: boolean
  onWakeUp: () => void
  children: React.ReactNode
}

export const SleepModeWrapper: React.FC<SleepModeWrapperProps> = ({
  isSleepMode,
  onWakeUp,
  children,
}) => {
  const handleMouseDown = async (e: React.MouseEvent) => {
    if (!isSleepMode) return
    // Prevent dragging if clicking buttons, inputs, etc.
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return

    try {
      await getCurrentWindow().startDragging()
    } catch (error) {
      console.error('Failed to drag window:', error)
    }
  }

  const content = (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: isSleepMode ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        width: isSleepMode ? '280px' : '100%',
        height: isSleepMode ? '200px' : '100%',
        minHeight: isSleepMode ? '200px' : 'auto',
        maxHeight: isSleepMode ? '200px' : 'none',
        backgroundColor: isSleepMode ? 'rgba(20, 20, 20, 1.0)' : 'inherit',
        backdropFilter: isSleepMode ? 'blur(16px)' : 'none',
        borderRadius: isSleepMode ? '20px' : '0px',
        border: isSleepMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
        zIndex: isSleepMode ? 9999 : 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: isSleepMode ? 'grab' : 'default',
        userSelect: 'none',
      }}
    >
      {isSleepMode && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 16px 0',
          }}
        >
          <button
            type="button"
            title="Expand View"
            onClick={onWakeUp}
            style={{
              all: 'unset',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              fontWeight: 400,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
            }}
          >
            Expand ↗
          </button>
        </div>
      )}
      {children}
    </div>
  )

  if (isSleepMode) {
    return ReactDOM.createPortal(content, document.body)
  }

  return content
}