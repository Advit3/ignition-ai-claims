import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Mail, Phone, Calendar, Hash, Edit3, CheckCircle2 } from 'lucide-react'

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user')) || { name: '', email: '' }
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    age: '',
    dob: ''
  })
  const [updated, setUpdated] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setUpdated(true)
    setTimeout(() => setUpdated(false), 3000)
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-3xl bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border border-[#D1D9E0] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 sm:p-10 relative overflow-hidden flex flex-col"
      >
        <div className="mb-8 border-b border-[#D1D9E0]/50 pb-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
          <div className="relative group cursor-pointer z-10 w-20 h-20 shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_8px_20px_rgba(79,70,229,0.4)] transition-shadow">
              <span className="text-white font-black text-3xl">{initial}</span>
            </div>
            <div className="absolute inset-0 bg-[#111827]/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex-1 mt-2">
            <h1 className="text-2xl font-black text-[#111827] mb-1.5 tracking-tight">Personal Information</h1>
            <h2 className="text-[#6B7280] text-sm font-semibold tracking-wide">Update your profile settings securely.</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full group/form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Full Name</label>
              <div className="relative group focus-within:z-10">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-sm transition-all bg-white"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#6B7280] font-bold bg-[#F3F4F6] shadow-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Phone Number</label>
              <div className="relative group focus-within:z-10">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 98765 43210"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-sm transition-all bg-white placeholder-[#9CA3AF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 relative">
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Age</label>
                <div className="relative group focus-within:z-10">
                  <input 
                    type="number" 
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="25"
                    className="w-full px-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-sm transition-all bg-white placeholder-[#9CA3AF]"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 relative">
                <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Date of Birth</label>
                <div className="relative group focus-within:z-10">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full pl-9 pr-3 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-sm transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#D1D9E0]/50 flex items-center justify-between sm:flex-row flex-col-reverse gap-4">
            <div className="w-full sm:w-auto h-12 flex items-center">
              <AnimatePresence>
                {updated && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="bg-[#10B981]/10 border border-[#10B981]/30 px-5 py-2.5 rounded-xl flex items-center gap-3 shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 text-[#10B981]" strokeWidth={2.5} />
                    <span className="text-[#10B981] font-bold text-sm tracking-wide">Profile Updated Successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(79,70,229,0.35)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white font-bold rounded-xl tracking-wide shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all cursor-pointer"
            >
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
