import React, { useState, useEffect } from 'react'
import { getCurrentWindow, currentMonitor } from '@tauri-apps/api/window'
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'

export const ToggleModeButton: React.FC = () => {
  // Initialize state synchronously from localStorage to persist across view switches
  const [isLargeMode, setIsLargeMode] = useState(() => {
    return localStorage.getItem('isLargeMode') === 'true'
  })
  const [isHovered, setIsHovered] = useState(false)

  // Listen for hotkey shortcut event from Rust to reset large mode state
  useEffect(() => {
    const unlistenPromise = listen('reset-large-mode', () => {
      setIsLargeMode(false)
      localStorage.setItem('isLargeMode', 'false')
    })

    return () => {
      unlistenPromise.then((unlisten) => unlisten())
    }
  }, [])

  const handleToggleLargeMode = async () => {
    console.log('=== Toggle Large Mode Clicked ===', { isLargeMode })
    try {
      const win = getCurrentWindow()
      const nextLargeMode = !isLargeMode
      const monitor = await currentMonitor()

      if (nextLargeMode) {
        const windowWidth = 1200
        const windowHeight = 800

        if (monitor) {
          const screenWidth = monitor.size.width
          const screenHeight = monitor.size.height
          const monitorX = monitor.position.x
          const monitorY = monitor.position.y

          const targetX = monitorX + Math.floor((screenWidth - windowWidth) / 2)
          const targetY = monitorY + Math.floor((screenHeight - windowHeight) / 2)

          await Promise.all([
            win.setSize(new PhysicalSize(windowWidth, windowHeight)),
            win.setPosition(new PhysicalPosition(targetX, targetY))
          ])
        } else {
          await win.setSize(new PhysicalSize(windowWidth, windowHeight))
          await win.center()
        }
      } else {
        console.log('Returning to right-side panel mode (380x720 physical)...')
        const windowWidth = 380
        const windowHeight = 720
        
        if (monitor) {
          const screenWidth = monitor.size.width
          const screenHeight = monitor.size.height
          const monitorX = monitor.position.x

          const targetX = monitorX + screenWidth - windowWidth
          const targetY = Math.max((screenHeight - windowHeight) / 2, 20)

          await Promise.all([
            win.setSize(new PhysicalSize(windowWidth, windowHeight)),
            win.setPosition(new PhysicalPosition(targetX, targetY))
          ])
        } else {
          await win.setSize(new PhysicalSize(windowWidth, windowHeight))
          await win.center()
        }
      }

      setIsLargeMode(nextLargeMode)
      localStorage.setItem('isLargeMode', String(nextLargeMode))
      console.log('Successfully toggled state to:', nextLargeMode)
    } catch (error) {
      console.error('Failed to toggle window mode:', error)
      alert(`Window resize failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <button
      type="button"
      aria-label={isLargeMode ? 'Switch to side panel mode' : 'Switch to large mode'}
      onClick={() => void handleToggleLargeMode()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.14)'}`,
        background: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
        color: isHovered ? '#fff' : 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 99999,
        pointerEvents: 'auto',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.35)' : '0 10px 30px rgba(0,0,0,0.25)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {isLargeMode ? (
        // Collapse / Minimize SVG Icon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
        </svg>
      ) : (
        // Expand / Maximize SVG Icon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      )}
    </button>
  )
}