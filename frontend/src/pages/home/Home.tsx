import React, { useRef } from 'react'
import { MathOrb } from './MathOrb'
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
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="panel home-page" ref={containerRef}>
      <ToggleModeButton />

      <MathOrb containerRef={containerRef} />

      <section id="center" className="home-center">
        <div>
          <h1>
            DoXor
          </h1>
        </div>

        <div className="landing-actions">
          <button type="button" className="glossy-button upload-btn" onClick={onOpenStudyLens}>
            Study Lens
          </button>

          <button type="button" className="glossy-button" onClick={onLaunch}>
            AI Assistant
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