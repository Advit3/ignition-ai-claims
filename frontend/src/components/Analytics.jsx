import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, ShieldCheck, Clock, TrendingUp, Loader2, AlertCircle, FileText } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'

const safeAmount = (val) => {
  if (val === null || val === undefined || !isFinite(val) || isNaN(val)) return 'N/A'
  return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
}

const safeFraud = (val) => {
  if (val === null || val === undefined || !isFinite(val) || isNaN(val)) return 'N/A'
  return (val * 100).toFixed(1) + '%'
}

const statusColor = (status) => {
  switch (status) {
    case 'approved': return { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]', border: 'border-[#6EE7B7]' }
    case 'pending': return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]' }
    case 'rejected': return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' }
    default: return { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', border: 'border-[#D1D9E0]' }
  }
}

function StatCard({ title, value, icon: Icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[#FFFFFF] p-6 rounded-xl border border-[#D1D9E0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-between"
    >
      <div>
        <p className="text-sm font-semibold text-[#6B7280] mb-2">{title}</p>
        <h4 className="text-2xl font-black text-[#111827]">{value}</h4>
      </div>
      <div className="w-12 h-12 bg-[#EEF2FF] rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#4F46E5]" />
      </div>
    </motion.div>
  )
}

export default function Analytics() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/claims')
        const data = response.data?.data
        setClaims(data?.claims || [])
      } catch (err) {
        setError('Unable to load claims. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchClaims()
  }, [])

  const totalClaims = claims.length
  const approvedCount = claims.filter(c => c.claim_status === 'approved').length
  const pendingCount = claims.filter(c => c.claim_status === 'pending').length
  const rejectedCount = claims.filter(c => c.claim_status === 'rejected').length
  const approvalRate = totalClaims > 0 ? ((approvedCount / totalClaims) * 100).toFixed(0) + '%' : '0%'

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 overflow-hidden pb-8 mt-2">
      <div className="mb-2">
        <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-2">Claims Dashboard</h2>
        <p className="text-[#6B7280] font-medium">Track your submitted claims and their processing status.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Claims" value={totalClaims} icon={Activity} delay={0} />
        <StatCard title="Approved" value={approvedCount} icon={ShieldCheck} delay={0.1} />
        <StatCard title="Pending Review" value={pendingCount} icon={Clock} delay={0.2} />
        <StatCard title="Approval Rate" value={approvalRate} icon={TrendingUp} delay={0.3} />
      </div>

      {/* Claims List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-[#FFFFFF] border border-[#D1D9E0] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden"
      >
        <div className="p-6 sm:p-8 border-b border-[#D1D9E0]/60">
          <h3 className="text-lg font-bold text-[#111827]">Recent Claims</h3>
          <p className="text-sm font-medium text-[#6B7280] mt-1">All claims submitted from your account</p>
        </div>

        {loading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <p className="text-sm font-semibold text-[#6B7280]">Loading claims...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-[#DC2626]" />
            </div>
            <p className="text-sm font-semibold text-[#DC2626]">{error}</p>
          </div>
        )}

        {!loading && !error && claims.length === 0 && (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 bg-[#F3F4F6] rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-[#9CA3AF]" />
            </div>
            <p className="text-sm font-bold text-[#6B7280]">No claims submitted yet</p>
            <p className="text-xs font-medium text-[#9CA3AF]">Submit your first claim to see it here</p>
          </div>
        )}

        {!loading && !error && claims.length > 0 && (
          <div className="divide-y divide-[#F3F4F6]">
            {claims.map((claim, idx) => {
              const sc = statusColor(claim.claim_status)
              return (
                <motion.div
                  key={claim.claim_id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2.5 py-1 rounded-md tracking-wide">
                        {claim.claim_id || 'N/A'}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md border capitalize ${sc.bg} ${sc.text} ${sc.border}`}>
                        {claim.claim_status || 'unknown'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#111827] truncate">{claim.claim_type || 'Insurance Claim'}</p>
                    {claim.status_reason && (
                      <p className="text-xs font-medium text-[#9CA3AF] mt-1 truncate max-w-md">{claim.status_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Amount</p>
                      <p className="text-sm font-black text-[#111827]">{safeAmount(claim.claim_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Risk</p>
                      <p className="text-sm font-black text-[#111827]">{safeFraud(claim.fraud_score)}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
