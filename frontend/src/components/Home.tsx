import React, { useRef } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '../assets/vite.svg'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="panel">
      <section id="center">
        <div>
          <h1>Talk with an AI</h1>
        </div>

        {/* Action Buttons */}
        <div className="landing-actions">
          <button type="button" className="counter" onClick={onLaunch}>
            Launch AI Assistant ✨
          </button>

          <button 
            type="button" 
            className="counter upload-btn" 
            onClick={onOpenPomodoro}
          >
            Pomodoro Timer 🍅
          </button>

          <button 
            type="button" 
            className="counter upload-btn" 
            onClick={handleUploadClick}
          >
            Upload Documents 📄
          </button>

          {/* Hidden File Input */}
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

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank" rel="noreferrer">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}