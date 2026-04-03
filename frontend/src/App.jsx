import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Flow from './components/Flow'
import Benefits from './components/Benefits'
import Auth from './components/Auth'
import Home from './components/Home'

function App() {
  const [appState, setAppState] = useState('landing') // States: 'landing', 'auth', 'home'

  if (appState === 'home') {
    return <Home />
  }

  if (appState === 'auth') {
    return (
      <Auth 
        onBack={() => setAppState('landing')} 
        onSuccess={() => setAppState('home')} 
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#1E293B] overflow-hidden">
      <Navbar />
      <Hero onClaimClick={() => {
        window.scrollTo(0, 0)
        setAppState('auth')
      }} />
      <Flow />
      <Benefits />
    </div>
  )
}

export default App
