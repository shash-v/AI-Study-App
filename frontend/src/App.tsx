import { useState } from 'react'
import { Home } from './pages/home/Home'
import { ChatDashboard } from './pages/chat/ChatDashboard'
import { Pomodoro } from './pages/pomodoro/Pomodoro'
import { UploadDashboard } from './pages/upload/UploadDashboard'
import { StudyLens } from './pages/study-lens/StudyLens'

type CurrentView = 'home' | 'dashboard' | 'pomodoro' | 'upload' | 'study-lens'

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
    case 'study-lens':
      return <StudyLens onBack={() => setCurrentView('home')} />
    case 'home':
    default:
      return (
        <Home
          onLaunch={() => setCurrentView('dashboard')}
          onOpenStudyLens={() => setCurrentView('study-lens')}
          onOpenPomodoro={() => setCurrentView('pomodoro')}
          onOpenUploadPage={handleOpenUploadPage}
        />
      )
  }
}

export default App