import React, { useState, useEffect } from 'react'
import { getCurrentWindow, currentMonitor } from '@tauri-apps/api/window'
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/dpi'
import { listen } from '@tauri-apps/api/event'

export const ToggleModeButton: React.FC = () => {
  const [isLargeMode, setIsLargeMode] = useState(false)

  // Listen for hotkey shortcut event from Rust to reset large mode state
  useEffect(() => {
    const unlistenPromise = listen('reset-large-mode', () => {
      setIsLargeMode(false)
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
        console.log('Resizing to large mode (1200x800 physical)...')
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
      console.log('Successfully toggled state to:', nextLargeMode)
    } catch (error) {
      console.error('CRITICAL: Failed to toggle window mode:', error)
      alert(`Window resize failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <button
      type="button"
      aria-label={isLargeMode ? 'Switch to side panel mode' : 'Switch to large mode'}
      title={isLargeMode ? 'Side panel mode' : 'Large mode'}
      onClick={() => void handleToggleLargeMode()}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        background: 'rgba(255, 255, 255, 0.04)',
        color: '#fff',
        fontSize: '18px',
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 99999,
        pointerEvents: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      {isLargeMode ? '⤡' : '⤢'}
    </button>
  )
}