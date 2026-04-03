import { motion } from 'framer-motion'
import { Activity, ShieldCheck, Clock, TrendingUp } from 'lucide-react'

function StatCard({ title, value, icon: Icon, trend, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[#FFFFFF] p-6 rounded-xl border border-[#D1D9E0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-[#6B7280] mb-2">{title}</p>
        <div className="flex items-end gap-3">
          <h4 className="text-2xl font-black text-[#111827]">{value}</h4>
          <span className="text-xs font-bold text-[#10B981] mb-1">{trend}</span>
        </div>
      </div>
      <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#4F46E5]" />
      </div>
    </motion.div>
  )
}

function MockBarChart() {
  const data = [30, 60, 45, 90, 65, 100, 80]
  return (
    <div className="h-48 w-full flex items-end justify-between gap-1 sm:gap-4 mt-4 px-2">
      {data.map((height, i) => (
        <div key={i} className="w-full flex flex-col items-center gap-3">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.8, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
            className="w-full bg-[#4F46E5] rounded-t-md opacity-90 shadow-[0_-4px_12px_rgba(79,70,229,0.1)] hover:opacity-100 transition-opacity"
          />
          <span className="text-[10px] sm:text-xs font-bold text-[#6B7280]">Day {i+1}</span>
        </div>
      ))}
    </div>
  )
}

function MockCircularProgress() {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center mt-4">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="88" cy="88" r="74" stroke="#F4F6F8" strokeWidth="16" fill="none" />
        <motion.circle 
          cx="88" cy="88" r="74" 
          stroke="#10B981" strokeWidth="16" fill="none"
          strokeDasharray="465"
          initial={{ strokeDashoffset: 465 }}
          animate={{ strokeDashoffset: 46.5 }} // ~90% calculation mapped out over 465 length (100% full circle standard approximation mapped for demo graphic sizes)
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold text-[#111827]">90%</span>
        <span className="text-xs font-bold tracking-widest uppercase mt-1 text-[#6B7280]">Approval</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 overflow-hidden pb-8 mt-2">
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-2">Performance Analytics</h2>
        <p className="text-[#6B7280] font-medium">Real-time metrics on claim processing precision and speed.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Claims Processed" value="12,450" trend="+14%" icon={Activity} delay={0} />
        <StatCard title="Fraud Detection Rate" value="98.2%" trend="+2.1%" icon={ShieldCheck} delay={0.1} />
        <StatCard title="Avg Settlement Time" value="4.2 mins" trend="-1.5m" icon={Clock} delay={0.2} />
        <StatCard title="Auto-Approvals" value="85%" trend="+10%" icon={TrendingUp} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-4">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 bg-[#FFFFFF] border border-[#D1D9E0] rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#111827]">Claims Processed Over Time</h3>
              <p className="text-sm font-medium text-[#6B7280]">Volume of requests measured in 7 days</p>
            </div>
          </div>
          <div className="flex-1 flex items-end w-full min-h-[220px]">
             <MockBarChart />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-[#FFFFFF] border border-[#D1D9E0] rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="w-full mb-6 text-left">
            <h3 className="text-lg font-bold text-[#111827]">Efficiency Matrix</h3>
            <p className="text-sm font-medium text-[#6B7280]">Last 30 days throughput</p>
          </div>
          <MockCircularProgress />
        </motion.div>

      </div>
    </div>
  )
}
