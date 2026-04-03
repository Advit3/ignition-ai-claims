import { motion } from 'framer-motion'
import { Shield, Zap } from 'lucide-react'

export default function Navbar() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 flex items-center justify-between"
      style={{
        background: 'rgba(250, 249, 246, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E7E5E4'
      }}
    >
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
          style={{
            background: '#4F46E5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Shield className="w-5 h-5 text-white" />
          <Zap className="w-3 h-3 text-white absolute -bottom-0.5 -right-0.5" />
        </div>
        <span className="text-xl font-bold tracking-wide text-[#1E293B]">
          Seedha<span className="text-[#4F46E5]">Claim</span>
        </span>
      </div>

      <div className="flex items-center gap-8">
        <button 
          onClick={() => scrollToSection('benefits')}
          className="text-sm font-semibold tracking-wide text-[#64748B] hover:text-[#4F46E5] transition-colors uppercase"
        >
          Why Choose
        </button>
        <button 
          onClick={() => scrollToSection('flow')}
          className="text-sm font-semibold tracking-wide text-[#64748B] hover:text-[#4F46E5] transition-colors uppercase"
        >
          How It Works
        </button>
      </div>
    </motion.nav>
  )
}
