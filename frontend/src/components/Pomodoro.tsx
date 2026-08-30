import React, { useState, useEffect, useCallback } from 'react'

interface PomodoroProps {
  onBack: () => void
}

type Mode = 'work' | 'shortBreak' | 'longBreak'

const DURATIONS: Record<Mode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

export const Pomodoro: React.FC<PomodoroProps> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('work')
  const [timeLeft, setTimeLeft] = useState<number>(DURATIONS.work)
  const [isRunning, setIsRunning] = useState<boolean>(false)

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode)
    setTimeLeft(DURATIONS[newMode])
    setIsRunning(false)
  }, [])

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

  const toggleTimer = () => {
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(DURATIONS[mode])
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="panel chat-panel">
      {/* Top Header */}
      <div className="panel-header">
        <button type="button" className="header-back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      {/* Main Content Area */}
      <div className="chat-center-container">
        <div className="empty-state-view">
          <h1 className="ask-heading">
            {mode === 'work' ? 'Focus Session ⏱️' : mode === 'shortBreak' ? 'Short Break ☕' : 'Long Break 🌴'}
          </h1>

          {/* Mode Selector Pills */}
          <div className="pills-row">
            <button
              type="button"
              className={`pill-btn ${mode === 'work' ? 'active' : ''}`}
              onClick={() => switchMode('work')}
            >
              Work (25m)
            </button>
            <button
              type="button"
              className={`pill-btn ${mode === 'shortBreak' ? 'active' : ''}`}
              onClick={() => switchMode('shortBreak')}
            >
              Short Break (5m)
            </button>
            <button
              type="button"
              className={`pill-btn ${mode === 'longBreak' ? 'active' : ''}`}
              onClick={() => switchMode('longBreak')}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Timer Display */}
          <div style={{ fontSize: '4.5rem', fontWeight: 700, letterSpacing: '2px', margin: '20px 0' }}>
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="landing-actions">
            <button type="button" className="counter" onClick={toggleTimer}>
              {isRunning ? 'Pause ⏸️' : 'Start ▶️'}
            </button>
            <button type="button" className="counter upload-btn" onClick={resetTimer}>
              Reset 🔄
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Spacer for structural balance */}
      <div id="spacer"></div>
    </div>
  )
}