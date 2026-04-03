import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Loader2, Lock, XCircle, AlertCircle, ShieldCheck } from 'lucide-react'

// Safely format a number — returns "N/A" for null, undefined, NaN, Infinity
const safeNumber = (val) => {
  if (val === null || val === undefined || !isFinite(val) || isNaN(val)) return null
  return val
}

function getRejectReason(data) {
  const docMatch = safeNumber(data?.doc_match)
  const fraudScore = safeNumber(data?.fraud_score)

  if (docMatch !== null && docMatch === 0.1) {
    return 'Claim amount significantly exceeds documented evidence'
  }
  if (docMatch !== null && docMatch < 0.5) {
    return 'Incomplete or unclear documents provided'
  }
  if (fraudScore !== null && fraudScore > 0.85) {
    return 'Suspicious activity detected in claim pattern'
  }
  return data?.status_reason || 'Your claim could not be processed at this time'
}

export default function ClaimProcessingOverlay({ apiResponse, onReset }) {
  const [phase, setPhase] = useState(1) // 1 = Under Review, 2 = Steps, 3 = Result
  const [minDelayReached, setMinDelayReached] = useState(false)

  // Phase transitions (time-based)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(2), 1500)
    const t2 = setTimeout(() => setMinDelayReached(true), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Phase 3: show result only when BOTH api responded AND 3.5s passed
  useEffect(() => {
    if (apiResponse && minDelayReached) {
      setPhase(3)
    }
  }, [apiResponse, minDelayReached])

  const status = apiResponse?.claim_status
  const claimId = apiResponse?.claim_id

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {/* ───────── PHASE 1: Under Review ───────── */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg flex flex-col items-center text-center"
          >
            <div className="pulse-glow-badge w-24 h-24 bg-[#FEF3C7] rounded-full flex items-center justify-center mb-6 border border-[#FDE68A] shadow-[0_4px_20px_rgba(251,191,36,0.15)]">
              <Clock className="w-11 h-11 text-[#D97706]" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight mb-3">Under Review</h2>
            <p className="text-[#6B7280] font-semibold text-sm leading-relaxed max-w-sm">
              Our AI system is verifying your documents and details
            </p>
            <p className="text-[#9CA3AF] font-medium text-xs mt-3 max-w-sm leading-relaxed">
              Analysing documents, validating claim authenticity, and ensuring policy compliance
            </p>
          </motion.div>
        )}

        {/* ───────── PHASE 2: Verification Steps ───────── */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg flex flex-col items-center"
          >
            <div className="w-full flex flex-col gap-4">
              {/* Step 1 — Completed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0 }}
                className="bg-white border border-[#D1D9E0] rounded-xl p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-[#D1FAE5] rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#059669]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">Documents Uploaded</p>
                  <p className="text-xs font-medium text-[#9CA3AF] mt-1">OCR extracts text from uploaded documents</p>
                </div>
              </motion.div>

              {/* Step 2 — Active */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white border border-[#C7D2FE] rounded-xl p-5 flex items-start gap-4 shadow-[0_2px_8px_rgba(79,70,229,0.06)]"
              >
                <div className="w-10 h-10 bg-[#EEF2FF] rounded-full flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827]">AI Verification in Progress</p>
                  <p className="text-xs font-medium text-[#9CA3AF] mt-1">ML model evaluates claim risk</p>
                </div>
              </motion.div>

              {/* Step 3 — Waiting */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5 flex items-start gap-4 opacity-60"
              >
                <div className="w-10 h-10 bg-[#F3F4F6] rounded-full flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-[#9CA3AF]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#6B7280]">Fraud Check</p>
                  <p className="text-xs font-medium text-[#9CA3AF] mt-1">Fraud detection system validates patterns</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ───────── PHASE 3: Final Result ───────── */}
        {phase === 3 && status === 'approved' && (
          <motion.div
            key="phase3-approved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg flex flex-col items-center text-center"
          >
            <div className="green-shimmer-badge w-24 h-24 bg-[#D1FAE5] rounded-full flex items-center justify-center mb-6 border border-[#6EE7B7] shadow-[0_4px_20px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-11 h-11 text-[#059669]" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight mb-2">Approved</h2>
            {claimId && (
              <p className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-3 py-1.5 rounded-full mb-4 tracking-wide">
                {claimId}
              </p>
            )}
            <p className="text-[#6B7280] font-semibold text-sm leading-relaxed max-w-sm">
              Your claim has been successfully verified and approved
            </p>
            <p className="text-[#9CA3AF] font-medium text-xs mt-2">Amount will be processed shortly</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="mt-8 px-8 py-3 bg-[#4F46E5] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] cursor-pointer"
            >
              Submit a New Claim
            </motion.button>
          </motion.div>
        )}

        {phase === 3 && status === 'pending' && (
          <motion.div
            key="phase3-pending"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg flex flex-col items-center text-center"
          >
            <div className="pulse-glow-badge w-24 h-24 bg-[#FEF3C7] rounded-full flex items-center justify-center mb-6 border border-[#FDE68A] shadow-[0_4px_20px_rgba(251,191,36,0.15)]">
              <Clock className="w-11 h-11 text-[#D97706]" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight mb-2">Under Manual Review</h2>
            {claimId && (
              <p className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-3 py-1.5 rounded-full mb-4 tracking-wide">
                {claimId}
              </p>
            )}
            <p className="text-[#6B7280] font-semibold text-sm leading-relaxed max-w-sm">
              Your claim has been flagged for manual verification
            </p>
            {apiResponse?.status_reason && (
              <div className="mt-4 w-full bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold text-[#92400E] leading-relaxed">{apiResponse.status_reason}</p>
                </div>
              </div>
            )}
            <p className="text-[#9CA3AF] font-medium text-xs mt-4">Our team will review your claim within 24-48 hours</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="mt-6 px-8 py-3 bg-[#4F46E5] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] cursor-pointer"
            >
              Submit a New Claim
            </motion.button>
          </motion.div>
        )}

        {phase === 3 && status === 'rejected' && (
          <motion.div
            key="phase3-rejected"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-[#FEE2E2] rounded-full flex items-center justify-center mb-6 border border-[#FCA5A5] shadow-[0_4px_20px_rgba(239,68,68,0.15)]">
              <XCircle className="w-11 h-11 text-[#DC2626]" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight mb-2">Rejected</h2>
            {claimId && (
              <p className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-3 py-1.5 rounded-full mb-4 tracking-wide">
                {claimId}
              </p>
            )}
            <div className="mt-2 w-full bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-[#991B1B] leading-relaxed">
                  {getRejectReason(apiResponse)}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="mt-8 px-8 py-3 bg-[#4F46E5] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] cursor-pointer"
            >
              Submit a New Claim
            </motion.button>
          </motion.div>
        )}

        {/* Fallback for network error (apiResponse exists but status is unexpected) */}
        {phase === 3 && !['approved', 'pending', 'rejected'].includes(status) && (
          <motion.div
            key="phase3-error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 bg-[#FEE2E2] rounded-full flex items-center justify-center mb-6 border border-[#FCA5A5]">
              <AlertCircle className="w-11 h-11 text-[#DC2626]" strokeWidth={2} />
            </div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight mb-2">Something Went Wrong</h2>
            <p className="text-[#6B7280] font-semibold text-sm">Unable to process your claim. Please try again.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="mt-8 px-8 py-3 bg-[#4F46E5] text-white font-bold text-sm rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.2)] cursor-pointer"
            >
              Submit a New Claim
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
