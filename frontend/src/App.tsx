import { useState } from 'react'
import { Home } from './components/Home'
import { ChatDashboard } from './components/ChatDashboard'
import { Pomodoro } from './components/Pomodoro'
import { UploadDashboard } from './components/UploadDashboard'
import './App.css'

type CurrentView = 'home' | 'dashboard' | 'pomodoro' | 'upload'

function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('home')

  const handleOpenUploadPage = () => {
    setCurrentView('upload')
  }

  switch (currentView) {
    case 'dashboard':
      return <ChatDashboard onBack={() => setCurrentView('home')} />
    case 'pomodoro':
      return <Pomodoro onBack={() => setCurrentView('home')} />
    case 'upload':
      return <UploadDashboard onBack={() => setCurrentView('home')} />
    case 'home':
    default:
      return (
        <Home
          onLaunch={() => setCurrentView('dashboard')}
          onOpenPomodoro={() => setCurrentView('pomodoro')}
          onOpenUploadPage={handleOpenUploadPage}
        />
      )
  }
}

export default App