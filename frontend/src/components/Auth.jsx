import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, UserCircle2 } from 'lucide-react'

// Mock Google Icon SVG
function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GoogleAccountModal({ isOpen, onClose, onSuccess }) {
  const [selecting, setSelecting] = useState(null)

  const accounts = [
    { name: 'Shradha Sharma', email: 'shradha@gmail.com', initial: 'S', color: 'bg-emerald-600' },
    { name: 'Demo User', email: 'demo@gmail.com', initial: 'D', color: 'bg-blue-600' }
  ]

  const handleSelect = (acc) => {
    setSelecting(acc.email)
    setTimeout(() => {
      onSuccess({ name: acc.name, email: acc.email })
      setSelecting(null)
    }, 1000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={selecting ? null : onClose}
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm bg-[#FFFFFF] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] relative z-10 overflow-hidden"
          >
            <div className="p-6 text-center border-b border-[#E2E8F0]">
              <div className="flex justify-center mb-4">
                <GoogleIcon className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-medium text-[#0F172A]">Choose an account</h2>
              <p className="text-sm font-medium text-[#64748B] mt-1">to continue to Seedha Claim</p>
            </div>

            <div className="py-2">
              {accounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleSelect(acc)}
                  disabled={selecting !== null}
                  className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#F1F5F9] transition-colors text-left disabled:opacity-50 cursor-pointer"
                >
                  <div className={`w-9 h-9 rounded-full ${acc.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white font-medium text-sm">{acc.initial}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-[#0F172A] text-sm truncate">{acc.name}</p>
                    <p className="text-[#64748B] text-xs truncate">{acc.email}</p>
                  </div>
                  {selecting === acc.email && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                  )}
                </button>
              ))}

              <div className="mx-6 my-2 h-[1px] bg-[#E2E8F0]" />

              <button
                disabled={selecting !== null}
                className="w-full px-6 py-3 flex items-center gap-4 hover:bg-[#F1F5F9] transition-colors text-left disabled:opacity-50 cursor-pointer"
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-6 h-6 text-[#64748B]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-[#0F172A] text-sm truncate">Use another account</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default function Auth({ onBack, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '' })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  // Google mock interaction states
  const [showGoogleModal, setShowGoogleModal] = useState(false)

  const validate = () => {
    let isValid = true
    const newErrors = { email: '', password: '' }
    
    if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.'
      isValid = false
    }
    if (password.length === 0) {
      newErrors.password = 'Password is required.'
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setIsLoading(true)
    localStorage.setItem("user", JSON.stringify({ name: "Guest User", email: email }))
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      setTimeout(() => onSuccess && onSuccess(), 1500)
    }, 1500)
  }

  const handleGoogleSuccess = (user) => {
    setShowGoogleModal(false)
    localStorage.setItem("user", JSON.stringify(user))
    setTimeout(() => {
      setIsSuccess(true)
      setTimeout(() => onSuccess && onSuccess(), 1500)
    }, 300) // gentle delay to allow modal exit animation
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-4 font-sans relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-[#64748B] hover:text-[#2563EB] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold tracking-wide text-sm">Back</span>
      </button>

      <GoogleAccountModal 
        isOpen={showGoogleModal} 
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-8 sm:p-10 relative overflow-hidden"
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A] mb-2">Get Started with Seedha Claim</h1>
                <p className="text-sm font-medium text-[#64748B]">Fast, secure insurance claim access</p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: ''})) }}
                    className={`w-full px-4 py-3 rounded-xl border bg-[#FFFFFF] outline-none transition-colors text-sm ${
                      errors.email ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E2E8F0] focus:border-[#2563EB]'
                    } placeholder-[#94A3B8] text-[#0F172A]`}
                  />
                  {errors.email && <span className="text-xs font-semibold text-[#EF4444] ml-1">{errors.email}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: ''})) }}
                      className={`w-full px-4 py-3 rounded-xl border bg-[#FFFFFF] outline-none transition-colors text-sm pr-12 ${
                        errors.password ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E2E8F0] focus:border-[#2563EB]'
                      } placeholder-[#94A3B8] text-[#0F172A]`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs font-semibold text-[#EF4444] ml-1">{errors.password}</span>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 rounded-xl font-bold text-white text-sm tracking-wide flex items-center justify-center transition-shadow shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                </motion.button>
              </form>

              <div className="flex items-center gap-4 my-7">
                <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">OR</span>
                <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowGoogleModal(true)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-semibold text-[#0F172A] text-sm tracking-wide flex items-center justify-center gap-3 bg-[#FFFFFF] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="login-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <div className="w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center mb-6 shadow-[0_4px_12px_rgba(22,163,74,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Login Successful</h2>
              <p className="text-[#64748B] text-sm font-medium">Redirecting you to dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
