import React, { useState, useRef } from 'react'
import { MathOrb } from './MathOrb'
import { checkHealth } from '../../../services/api'
import { ToggleModeButton } from '../../components/navigation/ToggleModeButton'
import './home.css'

interface HomeProps {
  onLaunch: () => void
  onOpenStudyLens: () => void
  onOpenPomodoro?: () => void
  onOpenUploadPage: () => void
}

export const Home: React.FC<HomeProps> = ({ 
  onLaunch, 
  onOpenStudyLens,
  onOpenPomodoro, 
  onOpenUploadPage 
}) => {
  const [isDoXHovered, setIsDoXHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calling your real backend API function
  const handleDoXClick = async () => {
    console.log('Pinging backend health check...')
    try {
      const data = await checkHealth()
      console.log('Backend response success:', data)
      alert('Successfully connected to backend!')
    } catch (error) {
      console.error('Failed to connect to backend:', error)
      alert('Backend connection failed.')
    }
  }

  return (
    <div className="panel home-page" ref={containerRef}>
      <ToggleModeButton />

      <MathOrb containerRef={containerRef} />

      <section id="center" className="home-center">
        <div>
          <h1>
            <span 
              onClick={handleDoXClick}
              title="Click to test backend API"
              className={isDoXHovered ? 'dox-mark is-hovered' : 'dox-mark'}
              onMouseEnter={() => setIsDoXHovered(true)}
              onMouseLeave={() => setIsDoXHovered(false)}
            >
              DoX
            </span>
            or
          </h1>
        </div>

        <div className="landing-actions">
          <button type="button" className="glossy-button" onClick={onLaunch}>
            AI Assistant
          </button>

          <button type="button" className="glossy-button upload-btn" onClick={onOpenStudyLens}>
            Study Lens
          </button>

          <button 
            type="button" 
            className="glossy-button upload-btn" 
            onClick={onOpenPomodoro}
          >
            Pomodoro
          </button>

          <button 
            type="button" 
            className="glossy-button upload-btn" 
            onClick={onOpenUploadPage}
          >
            Upload
          </button>
        </div>
      </section>

      <div className="ticks"></div>
    </div>
  )
}