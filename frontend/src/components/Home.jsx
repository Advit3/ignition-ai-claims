import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home as HomeIcon, User, BarChart2, MessageSquare, HeartPulse, Smartphone, CarFront, CheckCircle2, Shield, Sparkles } from 'lucide-react'
import Profile from './Profile'
import Analytics from './Analytics'
import Contact from './Contact'
import ClaimForm from './ClaimForm'
import GadgetClaim from './GadgetClaim'
import AutoClaim from './AutoClaim'

// Mock Navigation Data
const SIDEBAR_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'contact', label: 'Contact Us', icon: MessageSquare },
]

// Enhanced Premium Card Data
const INSURANCE_CARDS = [
  {
    id: 'health',
    title: 'Health Insurance',
    desc: 'Covers medical expenses, hospital bills, and emergency care.',
    icon: HeartPulse,
    color: '#EF4444', 
    features: ['Cashless network', 'Instant approvals', 'Zero deductions']
  },
  {
    id: 'gadget',
    title: 'Gadget Insurance',
    desc: 'Protects your devices against damage, theft, and breakdown.',
    icon: Smartphone,
    color: '#4F46E5', 
    features: ['Screen protection', 'Theft coverage', 'Liquid damage']
  },
  {
    id: 'auto',
    title: 'Auto Insurance',
    desc: 'Covers vehicle damage, accidents, and third-party liabilities.',
    icon: CarFront,
    color: '#0EA5A4', 
    features: ['Zero depreciation', 'Roadside assist', 'Engine cover']
  },
]

function Sidebar({ isOpen, onClose, activeItem, setActiveItem }) {
  const user = JSON.parse(localStorage.getItem('user')) || { 
    name: 'Guest User', 
    email: 'guest@example.com' 
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-full w-[260px] bg-[#FFFFFF] border-r border-[#E5E7EB] shadow-[4px_0_24px_rgba(0,0,0,0.04)] z-50 flex flex-col pt-4"
          >
            <div className="px-6 py-2 flex items-center justify-between mb-6">
              <span className="font-extrabold text-xl text-[#111827] tracking-tight">Seedha</span>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-md text-[#6B7280] hover:bg-[#F4F6F8] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-1 px-4">
              {SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = item.id === activeItem

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => {
                        setActiveItem(item.id)
                        onClose() 
                    }}
                    whileHover={!isActive ? { x: 6, backgroundColor: '#F3F4F6' } : {}}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left overflow-hidden cursor-pointer ${
                      isActive ? 'bg-[#EEF2FF]' : ''
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/5 bg-[#4F46E5] rounded-r-md" />
                    )}
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#4F46E5]' : 'text-[#6B7280]'}`} />
                    <span className={`${isActive ? 'font-bold text-[#111827]' : 'font-medium text-[#6B7280]'}`}>
                      {item.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
            
            <div className="mt-auto p-6 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#4F46E5] font-bold text-sm shadow-sm">
                   {user.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 overflow-hidden">
                   <p className="text-sm font-bold text-[#111827] tracking-tight truncate">{user.name}</p>
                   <p className="text-xs text-[#6B7280] truncate">{user.email}</p>
                 </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function InsuranceCard({ card, isSelected, onClick, index }) {
  const Icon = card.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 40, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
      animate={isSelected ? { 
        opacity: 1, 
        y: 0,
        scale: 1.02,
        boxShadow: '0 8px 20px rgba(0,0,0,0.06), inset 0 0 20px rgba(79,70,229,0.05)'
      } : {
        opacity: 1, 
        y: 0,
        scale: 1,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03), inset 0 0 0px rgba(79,70,229,0)'
      }}
      transition={{ 
        duration: 0.4, 
        ease: 'easeOut',
        delay: index * 0.15 
      }}
      whileHover={!isSelected ? { 
        y: -8, 
        scale: 1.02,
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)' 
      } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 sm:p-5 lg:p-6 rounded-2xl flex flex-col items-center text-center outline-none overflow-hidden cursor-pointer group transition-colors duration-300 z-10 w-full h-full ${
        isSelected 
          ? 'border-[2px] border-[#4F46E5] bg-[rgba(79,70,229,0.05)]' 
          : 'bg-[#FFFFFF] border border-[#D1D9E0] hover:border-[#D1D9E0]/80'
      }`}
    >
      <div 
        className="absolute top-0 left-0 w-full h-[4px] pointer-events-none transition-colors" 
        style={{ backgroundColor: card.color }}
      />

      {/* Selected Inner Marker */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.4 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }} 
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute top-5 right-5 w-6 h-6 bg-[#4F46E5] rounded-full flex items-center justify-center shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-300"
        style={{ 
          color: card.color, 
          backgroundColor: isSelected ? `${card.color}15` : `${card.color}0A`,
          filter: isSelected ? 'brightness(1.1)' : 'brightness(1)'
        }}
        animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 3 }}
      >
        <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" strokeWidth={isSelected ? 2.5 : 2} />
      </motion.div>
      
      <h2 className="text-[17px] sm:text-xl font-extrabold tracking-tight mb-2 z-10 text-[#111827]">{card.title}</h2>
      <p className="text-[11px] sm:text-[13px] font-medium text-[#6B7280] leading-snug z-10 mb-4 sm:mb-5">
        {card.desc}
      </p>

      {/* Bullet Micro features */}
      <div className="mt-auto flex flex-col gap-2 w-full text-left bg-white/70 p-3 sm:p-4 rounded-xl border border-[#D1D9E0]/40 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-colors">
        {card.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}12` }}>
               <span className="text-[8px]" style={{ color: card.color }}>✔</span>
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-[#6B7280] tracking-wide">{feature}</span>
          </div>
        ))}
      </div>
    </motion.button>
  )
}

function HomeView({ onContinue }) {
  const [selectedCard, setSelectedCard] = useState(null)

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-2 relative h-full">
      
      {/* Side Ambient Floating Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 left-0 lg:left-10 opacity-[0.12] hidden md:block z-0 pointer-events-none"
      >
        <Shield className="w-16 h-16 text-[#4F46E5]" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0], rotate: [0, -8, 0] }} 
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-20 right-0 lg:right-10 opacity-[0.12] hidden md:block z-0 pointer-events-none"
      >
        <CheckCircle2 className="w-14 h-14 text-[#0EA5A4]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="text-center mb-6 flex flex-col items-center z-10"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#4F46E5] hidden sm:block opacity-90" />
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#111827] via-[#111827] to-[#4F46E5] pb-1">
            Select Coverage
          </h1>
        </div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-[#6B7280] font-black tracking-[0.15em] uppercase text-[10px] sm:text-[11px] lg:text-[12px]"
        >
          Choose the insurance plan that fits your needs
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-5xl z-10 px-2 lg:px-4 items-stretch content-center h-auto">
        {INSURANCE_CARDS.map((card, idx) => (
          <InsuranceCard
            key={card.id}
            index={idx}
            card={card}
            isSelected={selectedCard === card.id}
            onClick={() => setSelectedCard(card.id)}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: selectedCard ? 1 : 0.6, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-6 sm:mt-8 mb-6 w-full max-w-[280px] sm:max-w-[320px] z-10"
      >
        <motion.button
          whileHover={selectedCard ? { scale: 1.03, boxShadow: "0 12px 30px rgba(79,70,229,0.4)" } : {}}
          whileTap={selectedCard ? { scale: 0.95 } : {}}
          animate={selectedCard ? { 
            boxShadow: ["0 8px 20px rgba(79,70,229,0.25)", "0 8px 25px rgba(79,70,229,0.35)", "0 8px 20px rgba(79,70,229,0.25)"]
          } : {}}
          transition={selectedCard ? {
            boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
          } : {}}
          disabled={!selectedCard}
          onClick={() => { if(onContinue) onContinue(selectedCard) }}
          className={`w-full py-3.5 sm:py-4 rounded-xl font-bold text-white text-[15px] sm:text-[16px] tracking-wider transition-colors border-none ${
            selectedCard
              ? 'cursor-pointer bg-[#4F46E5]'
              : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed shadow-none border-none'
          }`}
          style={{
            background: selectedCard ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : ''
          }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  )
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('home')

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView key="home" onContinue={(card) => {
          if (card === 'gadget') {
            setCurrentView('gadget-claim')
          } else if (card === 'auto') {
            setCurrentView('auto-claim')
          } else {
            setCurrentView('claim')
          }
        }} />
      case 'profile':
        return <Profile key="profile" />
      case 'analytics':
        return <Analytics key="analytics" />
      case 'contact':
        return <Contact key="contact" />
      case 'claim':
        return <ClaimForm key="claim" onComplete={() => setCurrentView('home')} />
      case 'gadget-claim':
        return <GadgetClaim key="gadget-claim" onComplete={() => setCurrentView('home')} />
      case 'auto-claim':
        return <AutoClaim key="auto-claim" onComplete={() => setCurrentView('home')} />
      default:
        return <HomeView key="default" onContinue={(card) => setCurrentView('claim')} />
    }
  }

  return (
    <div className="h-[100dvh] max-h-screen bg-[#F4F6F8] font-sans flex flex-col items-center relative overflow-hidden">
      
      {/* Animated Organic Background Shifts */}
      <motion.div 
        animate={{ y: [-20, 20, -20], scale: [1, 1.05, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4F46E5] rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div 
        animate={{ y: [20, -20, 20], scale: [1, 1.1, 1], opacity: [0.02, 0.05, 0.02] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0EA5A4] rounded-full blur-[120px] pointer-events-none z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#F4F6F8]/80 to-[#E9EEF2]/80 z-0 pointer-events-none backdrop-blur-[20px]" />

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        activeItem={currentView}
        setActiveItem={setCurrentView}
      />

      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FFFFFF] border border-[#D1D9E0] rounded-md flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-[#4F46E5]/40 transition-all text-[#111827] focus:outline-none cursor-pointer"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="flex-1 w-full px-4 sm:px-8 relative z-10 flex flex-col max-w-7xl mx-auto h-[100dvh] justify-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex-1 w-full flex flex-col h-[100dvh]"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
