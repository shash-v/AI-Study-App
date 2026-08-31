import React, { useRef, useState } from 'react'
import { MathOrb } from './MathOrb'
import { checkHealth } from '../../services/api' // Adjust path if needed

interface HomeProps {
  onLaunch: () => void
  onOpenPomodoro?: () => void
  onUploadDocuments?: (files: FileList) => void
}

export const Home: React.FC<HomeProps> = ({ 
  onLaunch, 
  onOpenPomodoro, 
  onUploadDocuments 
}) => {
  const [isDoXHovered, setIsDoXHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
    <div className="panel" ref={containerRef} style={{ position: 'relative' }}>
      <MathOrb containerRef={containerRef} />

      <section id="center" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <h1>
            <span 
              onClick={handleDoXClick}
              title="Click to test backend API"
              style={{
                cursor: 'pointer',
                background: isDoXHovered ? 'linear-gradient(135deg, #38bdf8, #c084fc)' : 'none',
                WebkitBackgroundClip: isDoXHovered ? 'text' : 'initial',
                WebkitTextFillColor: isDoXHovered ? 'transparent' : 'inherit',
                color: isDoXHovered ? 'transparent' : 'inherit',
                transition: 'all 0.2s ease',
              }}
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
            onClick={handleUploadClick}
          >
            Upload
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

      <div className="ticks"></div>
    </div>
  )
}