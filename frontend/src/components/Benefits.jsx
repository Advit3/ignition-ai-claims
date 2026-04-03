import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Timer, FileX2, BrainCircuit, UserCheck, Eye, ShieldCheck } from 'lucide-react'

const cards = [
  {
    icon: Timer,
    title: 'Faster Settlements',
    desc: 'Get your claims settled instantly instead of waiting weeks.',
    color: '#3B82F6' // Blue
  },
  {
    icon: FileX2,
    title: 'Zero Paperwork',
    desc: 'No more physical forms. Everything is digitized and parsed by AI.',
    color: '#EC4899' // Pink
  },
  {
    icon: BrainCircuit,
    title: 'Fraud Detection AI',
    desc: 'Advanced neural networks catch malicious activity with 99% accuracy.',
    color: '#8B5CF6' // Purple
  },
  {
    icon: UserCheck,
    title: 'Trusted User Fast-Track',
    desc: 'Verified customers bypass extensive checks for immediate payout.',
    color: '#10B981' // Green
  },
  {
    icon: Eye,
    title: 'Transparent Decisions',
    desc: 'Clear insight into exactly why a claim was approved or denied.',
    color: '#F59E0B' // Amber
  },
  {
    icon: ShieldCheck,
    title: 'Secure Processing',
    desc: 'Bank-level encryption protects your sensitive personal data.',
    color: '#14B8A6' // Teal
  }
]

function Card({ card, index }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const Icon = card.icon

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, translateY: -5 }}
      style={{ '--card-color': card.color }}
      className="p-8 rounded-3xl relative group cursor-pointer bg-[#FFFFFF] border border-[#E7E5E4] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-transparent"
    >
      {/* Bottom accent glow dynamically tracking the card color */}
      <div 
        className="absolute bottom-0 left-0 w-full h-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: card.color }}
      />
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
        style={{ background: `linear-gradient(to top right, ${card.color}, transparent)` }}
      />

      <div className="relative z-20">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative transition-all duration-500 group-hover:-translate-y-1"
        >
          {/* Icon background */}
          <div className="absolute inset-0 opacity-[0.1] rounded-2xl transition-opacity duration-500 group-hover:opacity-[0.2]" style={{ backgroundColor: card.color }} />
          
          <Icon 
            className="w-7 h-7 relative z-10 transition-all duration-500 group-hover:scale-110" 
            style={{ color: card.color, filter: `drop-shadow(0 4px 6px ${card.color}40)` }}
          />
        </div>

        <h3 className="text-xl font-bold text-[#1E293B] mb-3 transition-colors duration-500">
          {card.title}
        </h3>
        <p className="text-[#64748B] leading-relaxed transition-colors duration-500">
          {card.desc}
        </p>
      </div>
    </motion.div>
  )
}

export default function Benefits() {
  const headerRef = useRef(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-50px' })

  return (
    <section id="benefits" className="py-24 sm:py-32 px-4 sm:px-6 bg-[#FDF8F5] relative z-0 overflow-hidden">
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
          Why Choose <span className="text-[#4F46E5]">Seedha</span>
        </h2>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {cards.map((card, index) => (
          <Card key={index} card={card} index={index} />
        ))}
      </div>
    </section>
  )
}
