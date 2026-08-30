import React, { useState, useEffect, useCallback, useRef } from 'react'

interface PomodoroProps {
  onBack: () => void
}

type Mode = 'work' | 'shortBreak' | 'longBreak'

interface Durations {
  work: number
  shortBreak: number
  longBreak: number
}

const DEFAULT_DURATIONS: Durations = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

export const Pomodoro: React.FC<PomodoroProps> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('work')
  const [durations, setDurations] = useState<Durations>(DEFAULT_DURATIONS)
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATIONS.work)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)

  // Settings form input state (in minutes)
  const [customWork, setCustomWork] = useState<number>(25)
  const [customShort, setCustomShort] = useState<number>(5)
  const [customLong, setCustomLong] = useState<number>(15)

  const trackRef = useRef<HTMLDivElement>(null)

  const modes: { key: Mode; label: string }[] = [
    { key: 'work', label: 'Work' },
    { key: 'shortBreak', label: 'Short Break' },
    { key: 'longBreak', label: 'Long Break' },
  ]

  const switchMode = useCallback(
    (newMode: Mode, currentDurations = durations) => {
      setMode(newMode)
      setTimeLeft(currentDurations[newMode])
      setIsRunning(false)
    },
    [durations]
  )

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    if (mode === 'work') {
      switchMode('shortBreak')
    } else {
      switchMode('work')
    }
  }, [mode, switchMode])

  useEffect(() => {
    if (!isRunning) return

    if (timeLeft === 0) {
      handleTimerComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft, handleTimerComplete])

  // Handles drag & click positioning across the slider segments
  const updateModeFromX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const offsetX = clientX - rect.left
      const percent = Math.max(0, Math.min(1, offsetX / rect.width))

      if (percent < 0.33) {
        switchMode('work')
      } else if (percent < 0.66) {
        switchMode('shortBreak')
      } else {
        switchMode('longBreak')
      }
    },
    [switchMode]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateModeFromX(e.clientX)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        updateModeFromX(e.clientX)
      }
    },
    [isDragging, updateModeFromX]
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

  const toggleTimer = () => {
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(durations[mode])
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    const newDurations: Durations = {
      work: Math.max(1, customWork) * 60,
      shortBreak: Math.max(1, customShort) * 60,
      longBreak: Math.max(1, customLong) * 60,
    }
    setDurations(newDurations)
    setTimeLeft(newDurations[mode])
    setIsRunning(false)
    setShowSettings(false)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const activeIndex = modes.findIndex((m) => m.key === mode)

  return (
    <div className="panel chat-panel" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Header Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '16px 20px',
          boxSizing: 'border-box',
        }}
      >
        <button type="button" className="header-back-btn" onClick={onBack}>
          Back
        </button>

        {/* Settings Gear Button */}
        <button
          type="button"
          onClick={() => setShowSettings((prev) => !prev)}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#f8fafc',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease',
          }}
        //   title="Timer Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSaveSettings}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '320px',
              color: '#f8fafc',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600 }}>Set Durations (minutes)</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                Work Session
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  style={{
                    width: '64px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    textAlign: 'center',
                  }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                Short Break
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customShort}
                  onChange={(e) => setCustomShort(Number(e.target.value))}
                  style={{
                    width: '64px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    textAlign: 'center',
                  }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                Long Break
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customLong}
                  onChange={(e) => setCustomLong(Number(e.target.value))}
                  style={{
                    width: '64px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    textAlign: 'center',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#6366f1',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main View */}
      <div className="chat-center-container">
        <div className="empty-state-view" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <h1 className="ask-heading">
            {mode === 'work' ? 'Focus Session ⏱️' : mode === 'shortBreak' ? 'Short Break ☕' : 'Long Break 🌴'}
          </h1>

          {/* Draggable Ovular Slider */}
          <div
            ref={trackRef}
            onMouseDown={handleMouseDown}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e293b',
              borderRadius: '9999px',
              padding: '4px',
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid #334155',
              boxShadow: '0 0 16px rgba(99, 102, 241, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.05)',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              overflow: 'hidden',
            }}
          >
            {/* Sliding Active Pill Background */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                bottom: '4px',
                left: '4px',
                width: 'calc((100% - 8px) / 3)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                transform: `translateX(${activeIndex * 100}%)`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1,
              }}
            />

            {/* Slider Labels */}
            {modes.map(({ key, label }) => (
              <div
                key={key}
                style={{
                  flex: 1,
                  position: 'relative',
                  zIndex: 2,
                  textAlign: 'center',
                  padding: '10px 4px',
                  fontSize: '0.85rem',
                  fontWeight: mode === key ? 600 : 500,
                  color: mode === key ? '#ffffff' : '#94a3b8',
                  transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pointerEvents: 'none',
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Digital Timer Clock Display */}
          <div style={{ fontSize: '4.5rem', fontWeight: 700, letterSpacing: '2px', margin: '20px 0' }}>
            {formatTime(timeLeft)}
          </div>

          {/* Primary Timer Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%' }}>
            <button
                type="button"
                onClick={toggleTimer}
                style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '9999px',
                border: 'none',
                background: isRunning 
                    ? '#334155' 
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: isRunning 
                    ? '0 2px 8px rgba(0,0,0,0.2)' 
                    : '0 4px 14px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
                }}
            >
                {isRunning ? 'Pause' : 'Start'}
            </button>
            
            <button
                type="button"
                onClick={resetTimer}
                style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '9999px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
                }}
            >
                Reset
            </button>
            </div>
        </div>
      </div>

      <div id="spacer"></div>
    </div>
  )
}