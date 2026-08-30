import { useState } from 'react'
import { Home } from './components/Home'
import { ChatDashboard } from './components/ChatDashboard'
import { Pomodoro } from './components/Pomodoro'
import './App.css'

type CurrentView = 'home' | 'dashboard' | 'pomodoro'

function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('home')

  const handleUploadDocuments = (files: FileList) => {
    console.log('Files uploaded:', files)
    setCurrentView('dashboard')
  }

  switch (currentView) {
    case 'dashboard':
      return <ChatDashboard onBack={() => setCurrentView('home')} />
    case 'pomodoro':
      return <Pomodoro onBack={() => setCurrentView('home')} />
    case 'home':
    default:
      return (
        <Home
          onLaunch={() => setCurrentView('dashboard')}
          onOpenPomodoro={() => setCurrentView('pomodoro')}
          onUploadDocuments={handleUploadDocuments}
        />
      )
  }
}

export default App