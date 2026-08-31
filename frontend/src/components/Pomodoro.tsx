import React, { useState, useEffect, useCallback, useRef } from 'react'
import { BackButton } from './BackButton'
import { SettingsModal } from './SettingsModal'
import { SleepModeWrapper } from './SleepModeWrapper'

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
  const [isSleepMode, setIsSleepMode] = useState<boolean>(false)

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
    <SleepModeWrapper isSleepMode={isSleepMode} onWakeUp={() => setIsSleepMode(false)}>
      <div className="panel chat-panel" style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Header Container (Hidden in Sleep Mode) */}
        {!isSleepMode && (
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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Sleep / Mini Mode Toggle Button */}
              <button
                type="button"
                title="Enter Mini Mode"
                onClick={() => setIsSleepMode(true)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8rem',
                  fontWeight: 400,
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
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
                Mini
              </button>

              {/* Settings Dot Button */}
              <button
                type="button"
                title="Settings"
                onClick={() => setShowSettings((prev) => !prev)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  border: '3px solid #141414',
                  boxShadow: showSettings 
                    ? '0 0 0 2px #f472b6bb, 0 4px 12px rgba(0, 0, 0, 0.9)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.5)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
                  transform: showSettings ? 'scale(1.25)' : 'scale(1)'
                }}
              />
            </div>
          </div>
        )}

        {/* Settings Modal Overlay */}
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Set Durations (minutes)">
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Work Session
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={customWork}
                  onChange={(e) => setCustomWork(Number(e.target.value))}
                  style={{
                    width: '56px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Short Break
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customShort}
                  onChange={(e) => setCustomShort(Number(e.target.value))}
                  style={{
                    width: '56px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Long Break
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={customLong}
                  onChange={(e) => setCustomLong(Number(e.target.value))}
                  style={{
                    width: '56px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'transparent',
                    color: '#fff',
                    textAlign: 'center',
                    outline: 'none',
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  padding: '6px 14px',
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
                  backgroundColor: 'var(--accent, #3b82f6)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 400,
                  fontSize: '0.85rem',
                }}
              >
                Save
              </button>
            </div>
          </form>
        </SettingsModal>

        {/* Main View */}
        <div className="chat-center-container" style={{ padding: isSleepMode ? '12px 20px 20px' : '20px' }}>
          <div className="empty-state-view" style={{ width: '100%', maxWidth: '380px', margin: '0 auto' }}>
            {/* Draggable Ovular Slider (Hidden in Sleep Mode) */}
            {!isSleepMode && (
              <div
                ref={trackRef}
                onMouseDown={handleMouseDown}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '9999px',
                  padding: '3px',
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  overflow: 'hidden',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    bottom: '3px',
                    left: '3px',
                    width: 'calc((100% - 6px) / 3)',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '9999px',
                    transform: `translateX(${activeIndex * 100}%)`,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                  }}
                />

                {modes.map(({ key, label }) => (
                  <div
                    key={key}
                    style={{
                      flex: 1,
                      position: 'relative',
                      zIndex: 2,
                      textAlign: 'center',
                      padding: '8px 4px',
                      fontSize: '0.85rem',
                      fontWeight: 400,
                      color: mode === key ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
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
            )}

            {/* Digital Timer Clock Display */}
            <div style={{ 
              fontSize: isSleepMode ? '2.75rem' : '3.75rem', 
              fontWeight: 400, 
              fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '2px', 
              margin: isSleepMode ? '4px 0 16px' : '16px 0 24px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>
              {formatTime(timeLeft)}
            </div>

            {/* Primary Timer Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', width: '100%' }}>
              <button
                type="button"
                className="glossy-button"
                onClick={toggleTimer}
                style={{
                  flex: 1,
                  padding: isSleepMode ? '8px 16px' : '10px 20px',
                 }}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              
              <button
                type="button"
                onClick={resetTimer}
                style={{
                  flex: 1,
                  padding: isSleepMode ? '8px 16px' : '10px 20px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: 400,
                  cursor: 'pointer',
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
    </SleepModeWrapper>
  )
}