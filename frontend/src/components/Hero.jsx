import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, Brain, ScanLine, CheckCircle2, Banknote } from 'lucide-react'

const claimSteps = [
  { icon: Upload, label: 'Upload' },
  { icon: Brain, label: 'AI Analysis' },
  { icon: ScanLine, label: 'Fraud Check' },
  { icon: CheckCircle2, label: 'Approval' },
  { icon: Banknote, label: '₹ Credited' },
]

function FloatingOrb({ className, color, size, delay }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none mix-blend-multiply opacity-30 blur-[80px] ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      animate={{
        y: [0, -40, 0],
        x: [0, 40, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 12,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

function ClaimProgress() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % (claimSteps.length + 1))
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center flex-wrap gap-y-6">
      {claimSteps.map((step, i) => {
        const Icon = step.icon
        const isActive = i < active
        const isCurrent = i === active
        const isFinal = i === claimSteps.length - 1
        
        return (
          <div key={i} className="flex items-center">
            <motion.div
              animate={{
                scale: isCurrent ? 1.1 : 1,
                opacity: isActive || isCurrent ? 1 : 0.5,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isActive || isCurrent ? '#EEF2FF' : '#F5F5F4',
                  border: `1px solid #E7E5E4`,
                }}
              >
                <Icon
                  className="w-5 h-5 sm:w-7 sm:h-7 transition-colors duration-300"
                  style={{ color: isActive || isCurrent ? '#4F46E5' : '#94A3B8' }}
                />
              </div>
              <span
                className="absolute -bottom-7 text-[10px] sm:text-xs font-semibold tracking-wide whitespace-nowrap transition-colors duration-300"
                style={{ color: isActive || isCurrent ? '#1E293B' : '#94A3B8' }}
              >
                {step.label}
              </span>
            </motion.div>
            
            {/* Connector */}
            {i < claimSteps.length - 1 && (
              <div className="w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded-full bg-[#F5F5F4] relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: '#D6D3D1',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: isActive ? '100%' : '0%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Hero({ onClaimClick }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-[#FDF8F5]">
      {/* Attractive Beige Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FEF3C7]/40 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-gradient-to-t from-[#E0E7FF]/30 to-transparent blur-[100px] pointer-events-none" />
      </div>

      <div className="text-center z-10 w-full max-w-5xl mx-auto flex flex-col items-center mt-16">
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight mb-6"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#1E293B] via-[#334155] to-[#4F46E5] drop-shadow-sm">
            Seedha Claim
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl sm:text-2xl text-[#64748B] font-medium tracking-wide mb-16 max-w-2xl mx-auto leading-relaxed"
        >
          Sharp on fraud. Swift on settlement. <br className="hidden sm:block" /> 
          <span className="text-[#4F46E5] font-semibold">Experience the future of insurance.</span>
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full mb-20"
        >
          <ClaimProgress />
        </motion.div>

        <motion.button
          onClick={onClaimClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          whileHover={{ 
            scale: 1.03, 
            y: -3,
            boxShadow: '0 12px 30px rgba(79,70,229,0.3)',
          }}
          whileTap={{ scale: 0.97 }}
          className="px-12 py-5 rounded-2xl font-bold text-white text-lg tracking-wide relative overflow-hidden group cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
            boxShadow: '0 4px 15px rgba(79,70,229,0.15)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="relative z-10 flex items-center justify-center gap-2">Claim Your Insurance <span className="group-hover:translate-x-1 transition-transform">&rarr;</span></span>
        </motion.button>
      </div>
    </section>
  )
}
