import React, { useState, useEffect, useCallback, useRef } from 'react'

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
  const [position, setPosition] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  })

  // Reset custom position when entering or exiting sleep mode
  useEffect(() => {
    if (!isSleepMode) {
      setPosition({ x: null, y: null })
      setIsDragging(false)
    } else {
      // Default to top-right initial placement coordinates
      setPosition({
        x: window.innerWidth - 280 - 24,
        y: 24,
      })
    }
  }, [isSleepMode])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isSleepMode) return
    // Prevent dragging if clicking the expand button directly
    if ((e.target as HTMLElement).closest('button')) return

    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x ?? window.innerWidth - 280 - 24,
      initialY: position.y ?? 24,
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY

      const newX = Math.max(12, Math.min(window.innerWidth - 292, dragRef.current.initialX + dx))
      const newY = Math.max(12, Math.min(window.innerHeight - 252, dragRef.current.initialY + dy))

      setPosition({ x: newX, y: newY })
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: isSleepMode ? 'fixed' : 'relative',
        top: isSleepMode && position.y !== null ? `${position.y}px` : isSleepMode ? '24px' : 'auto',
        right: isSleepMode && position.x === null ? '24px' : 'auto',
        left: isSleepMode && position.x !== null ? `${position.x}px` : 'auto',
        width: isSleepMode ? '280px' : '100%',
        height: isSleepMode ? '200px' : '100%',
        maxHeight: isSleepMode ? '240px' : 'none',
        backgroundColor: isSleepMode ? 'rgba(20, 20, 20, 0.85)' : 'inherit',
        backdropFilter: isSleepMode ? 'blur(16px)' : 'none',
        borderRadius: isSleepMode ? '20px' : '0px',
        border: isSleepMode ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
        // boxShadow: isSleepMode ? '0 24px 48px rgba(0, 0, 0, 0.7)' : 'none',
        zIndex: isSleepMode ? 9999 : 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: isDragging ? 'none' : 'background-color 0.3s ease, border-radius 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        cursor: isSleepMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
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
          {/* Styled Expand Button matching header button styling */}
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
}