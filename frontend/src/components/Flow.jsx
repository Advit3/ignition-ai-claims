import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Upload, Brain, ScanLine, CheckCircle2, Banknote } from 'lucide-react'

const flowSteps = [
  { icon: Upload, label: 'Upload Claim', desc: 'Securely submit your documents in seconds.', color: '#3B82F6' },
  { icon: Brain, label: 'AI Verification', desc: 'Neural networks extract & verify data.', color: '#8B5CF6' },
  { icon: ScanLine, label: 'Fraud Check', desc: 'Real-time analysis against risk patterns.', color: '#F43F5E' },
  { icon: CheckCircle2, label: 'Approval', desc: 'Instant decision based on AI confidence.', color: '#10B981' },
  { icon: Banknote, label: 'Payment', desc: 'Funds transferred instantly to your bank.', color: '#F59E0B' },
]

function FlowNode({ step, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const Icon = step.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
      className="flex items-center gap-6 sm:gap-8 relative group"
    >
      {/* Vertical line connector */}
      {index !== flowSteps.length - 1 && (
        <motion.div
          initial={{ height: 0 }}
          animate={isInView ? { height: '100%' } : {}}
          transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
          className="absolute top-16 left-[1.8rem] w-1 -ml-0.5 z-0"
          style={{
            backgroundColor: '#CBD5F5'
          }}
        />
      )}

      {/* Particle animation along the line */}
      {index !== flowSteps.length - 1 && isInView && (
        <motion.div
          className="absolute top-16 left-[1.8rem] w-[5px] h-6 -ml-[0.15rem] rounded-full z-10"
          style={{ background: '#4F46E5' }}
          animate={{ top: ['4rem', 'calc(100% + 1rem)'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.15 + 0.5 }}
        />
      )}

      {/* Node icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 z-20 shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300 group-hover:scale-110 relative overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: `1px solid #E7E5E4`,
        }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300" style={{ backgroundColor: step.color }} />
        <Icon className="w-7 h-7 transition-transform duration-300 shadow-sm relative z-10 group-hover:rotate-6" style={{ color: step.color }} />
      </div>

      {/* Text content */}
      <div
        className="bg-[#FFFFFF] border border-[#E7E5E4] rounded-2xl p-6 flex-1 transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] group-hover:-translate-y-1 group-hover:border-transparent relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-bl-full pointer-events-none" style={{ backgroundColor: step.color }} />
        <h3 className="text-xl font-bold text-[#1E293B] mb-2 transition-transform duration-500 group-hover:translate-x-1">{step.label}</h3>
        <p className="text-[#64748B] leading-relaxed transition-transform duration-500 group-hover:translate-x-1">{step.desc}</p>
      </div>
    </motion.div>
  )
}

export default function Flow() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-50px' })

  return (
    <section id="flow" className="py-24 sm:py-32 px-4 sm:px-6 relative bg-[#FDF8F5] overflow-hidden">
      {/* Attractive Beige Glow Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#FEF3C7]/40 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-gradient-to-t from-[#E0E7FF]/30 to-transparent blur-[100px] pointer-events-none" />
      </div>
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 30 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mt-6 mb-20"
      >
        <h2 className="text-4xl sm:text-5xl font-extrabold text-[#1E293B]">
          How It <span className="text-[#4F46E5]">Works</span>
        </h2>
        <p className="text-[#64748B] mt-4 text-lg max-w-xl mx-auto">
          A seamless pipeline engineered for unprecedented speed and accuracy.
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-10">
        {flowSteps.map((step, index) => (
          <FlowNode key={index} step={step} index={index} />
        ))}
      </div>
    </section>
  )
}
