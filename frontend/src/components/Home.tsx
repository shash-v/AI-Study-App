import React, { useRef, useEffect, useState } from 'react'

interface HomeProps {
  onLaunch: () => void
  onOpenPomodoro?: () => void
  onUploadDocuments?: (files: FileList) => void
}

// Color Palette Options
const COLOR_PALETTES = [
  { name: 'Neon Pink', primary: '#f472b6', secondary: '#ec4899', fade: 'rgba(217, 70, 239, 0)' },
  { name: 'Cyber Cyan', primary: '#38bdf8', secondary: '#06b6d4', fade: 'rgba(59, 130, 246, 0)' },
  { name: 'Emerald', primary: '#34d399', secondary: '#10b981', fade: 'rgba(5, 150, 105, 0)' },
  { name: 'Amber Fire', primary: '#fbbf24', secondary: '#f59e0b', fade: 'rgba(239, 68, 68, 0)' },
  { name: 'Deep Violet', primary: '#c084fc', secondary: '#a855f7', fade: 'rgba(99, 102, 241, 0)' },
]

export const Home: React.FC<HomeProps> = ({ 
  onLaunch, 
  onOpenPomodoro, 
  onUploadDocuments 
}) => {
  const [isOrbActive, setIsOrbActive] = useState(true)
  const [isHoveringControl, setIsHoveringControl] = useState(false)
  const [activePaletteIndex, setActivePaletteIndex] = useState(0)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const isHoveringControlRef = useRef(false)
  const activePaletteRef = useRef(COLOR_PALETTES[0])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Keep refs in sync for the animation loop
  useEffect(() => {
    isHoveringControlRef.current = isHoveringControl
  }, [isHoveringControl])

  useEffect(() => {
    activePaletteRef.current = COLOR_PALETTES[activePaletteIndex]
  }, [activePaletteIndex])

  // Close palette when clicking anywhere outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.color-picker-container')) {
        setIsPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!isOrbActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    let animationFrameId: number
    const numPoints = 16
    const baseRadius = 45

    const resizeCanvas = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const pos = { x: canvas.width / 2, y: canvas.height / 3 }
    const targetPos = { x: canvas.width / 2, y: canvas.height / 3 }
    const vel = { x: 0, y: 0 }

    const handleMouseMove = (e: MouseEvent) => {
      // Freeze tracking target when cursor hovers over controls
      if (isHoveringControlRef.current) return

      const rect = container.getBoundingClientRect()
      targetPos.x = e.clientX - rect.left
      targetPos.y = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      targetPos.x = canvas.width / 2
      targetPos.y = canvas.height / 3
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    let time = 0
    const render = () => {
      time += 0.04
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const ax = (targetPos.x - pos.x) * 0.04
      const ay = (targetPos.y - pos.y) * 0.04
      vel.x = (vel.x + ax) * 0.86
      vel.y = (vel.y + ay) * 0.86
      pos.x += vel.x
      pos.y += vel.y

      const speed = Math.hypot(vel.x, vel.y)
      const currentPalette = activePaletteRef.current

      // Dynamic Radial Glow using active palette colors
      const gradient = ctx.createRadialGradient(
        pos.x, pos.y, 2,
        pos.x, pos.y, baseRadius + 25
      )
      gradient.addColorStop(0, currentPalette.primary)
      gradient.addColorStop(0.5, currentPalette.secondary)
      gradient.addColorStop(1, currentPalette.fade)

      ctx.beginPath()
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2
        
        const starFactor = i % 2 === 0 ? 1.15 : 0.85
        const wave1 = Math.sin(time * 2 + angle * 4) * 8
        const wave2 = Math.cos(time * 1.5 - angle * 2) * 5
        
        const r = (baseRadius * starFactor) + wave1 + wave2 + (speed * 1.2)
        
        const x = pos.x + Math.cos(angle) * r
        const y = pos.y + Math.sin(angle) * r

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          const prevAngle = ((i - 1) / numPoints) * Math.PI * 2
          const prevStar = (i - 1) % 2 === 0 ? 1.15 : 0.85
          const prevR = (baseRadius * prevStar) + Math.sin(time * 2 + prevAngle * 4) * 8
          
          const cpAngle = (angle + prevAngle) / 2
          const cpR = (r + prevR) / 2 + Math.sin(time * 3) * 4
          const cpx = pos.x + Math.cos(cpAngle) * cpR
          const cpy = pos.y + Math.sin(cpAngle) * cpR
          
          ctx.quadraticCurveTo(cpx, cpy, x, y)
        }
      }
      ctx.closePath()

      ctx.fillStyle = gradient
      ctx.fill()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isOrbActive])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      if (onUploadDocuments) {
        onUploadDocuments(files)
      } else {
        console.log('Selected files:', files)
      }
    }
  }

  const currentPalette = COLOR_PALETTES[activePaletteIndex]

  return (
    <div className="panel" ref={containerRef} style={{ position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          pointerEvents: 'none', 
          zIndex: 0 
        }} 
      />

      <section id="center" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <h1>DoXor</h1>
        </div>

        <div className="landing-actions">
          <button type="button" className="glossy-button" onClick={onLaunch}>
            Launch AI Assistant
          </button>

          <button 
            type="button" 
            className="glossy-button upload-btn" 
            onClick={onOpenPomodoro}
          >
            Pomodoro Timer
          </button>

          <button 
            type="button" 
            className="glossy-button upload-btn" 
            onClick={handleUploadClick}
          >
            Upload Documents
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple
            accept=".pdf,.txt,.doc,.docx"
          />
        </div>
      </section>

      {/* Floating Control Cluster */}
      <div
        className="color-picker-container"
        onMouseEnter={() => setIsHoveringControl(true)}
        onMouseLeave={() => setIsHoveringControl(false)}
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10
        }}
      >
        {/* Color Palette Menu (Toggled via click, stays open until selection or outside click) */}
        {isPickerOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '32px',
              right: '0',
              display: 'flex',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#141414',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {COLOR_PALETTES.map((palette, idx) => (
              <button
                key={palette.name}
                type="button"
                title={palette.name}
                onClick={() => {
                  setActivePaletteIndex(idx)
                  setIsPickerOpen(false)
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: 'none',
                  background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                  cursor: 'pointer',
                  transform: activePaletteIndex === idx ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: activePaletteIndex === idx ? `0 0 8px ${palette.primary}` : 'none',
                  transition: 'transform 0.15s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Button 1: Color Picker Dot */}
        <button
          type="button"
          title="Change Orb Color"
          onClick={() => setIsPickerOpen((prev) => !prev)}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentPalette.primary}, ${currentPalette.secondary})`,
            border: '3px solid #141414',
            boxShadow: `0 0 0 2px ${currentPalette.primary}bb, 0 4px 12px rgba(0, 0, 0, 0.9)`,
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            transform: isPickerOpen ? 'scale(1.25)' : 'scale(1)'
          }}
        />

        {/* Button 2: On/Off Toggle Dot */}
        <button
          type="button"
          title={isOrbActive ? "Disable Orb Animation" : "Enable Orb Animation"}
          onClick={() => setIsOrbActive((prev) => !prev)}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: isOrbActive ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
            border: '3px solid #141414',
            boxShadow: isOrbActive 
              ? `0 0 0 2px ${currentPalette.primary}bb, 0 4px 12px rgba(0, 0, 0, 0.9)` 
              : '0 4px 12px rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease'
          }}
        />
      </div>

      <div className="ticks"></div>
    </div>
  )
}