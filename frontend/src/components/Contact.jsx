import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, User, Send, CheckCircle2, Headphones, Zap, ShieldCheck } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-5xl bg-gradient-to-b from-[#FFFFFF] to-[#F8FAFC] border border-[#D1D9E0] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row"
      >
        {/* LEFT SECTION (INFO) */}
        <div className="md:w-5/12 bg-[#F8FAFC] border-r border-[#D1D9E0]/50 p-8 sm:p-10 flex flex-col z-10 relative">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-3">Get in Touch</h1>
            <h2 className="text-[#6B7280] font-semibold leading-relaxed text-sm">
              Our enterprise support team is available to assist you with claims, policy adjustments, and urgent inquiries.
            </h2>
          </div>

          <div className="flex flex-col gap-6 flex-1">
            <div className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-[#D1D9E0]/50">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                <Mail className="w-6 h-6 text-[#4F46E5]" strokeWidth={2.5} />
              </div>
              <div className="w-full">
                <p className="text-[11px] font-black text-[#6B7280] uppercase tracking-widest mb-1">Email Support</p>
                <p className="text-[#111827] font-bold sm:text-[17px] text-[13px] break-all sm:break-normal leading-tight">support@seedhaclaim.com</p>
              </div>
            </div>

            {/* Micro Details Info Cards */}
            <div className="grid grid-cols-1 gap-5 mt-auto pt-6 border-t border-[#D1D9E0]/50">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#10B981]/15 flex items-center justify-center shrink-0">
                   <Headphones className="w-5 h-5 text-[#10B981]" />
                 </div>
                 <h3 className="font-bold text-[15px] tracking-wide text-[#111827]">24/7 Dedicated Support</h3>
               </div>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#F59E0B]/15 flex items-center justify-center shrink-0">
                   <Zap className="w-5 h-5 text-[#F59E0B]" />
                 </div>
                 <h3 className="font-bold text-[15px] tracking-wide text-[#111827]">Fast Response Time</h3>
               </div>
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 flex items-center justify-center shrink-0">
                   <ShieldCheck className="w-5 h-5 text-[#4F46E5]" />
                 </div>
                 <h3 className="font-bold text-[15px] tracking-wide text-[#111827]">Secure Communication</h3>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION (FORM) */}
        <div className="md:w-7/12 p-8 sm:p-10 relative bg-white flex flex-col justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)]">
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-8 text-center"
              >
                <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#10B981]/20">
                  <CheckCircle2 className="w-10 h-10 text-[#10B981]" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black text-[#111827] tracking-tight">Message Sent Successfully</h2>
                <p className="text-[#6B7280] font-semibold mt-3 max-w-sm mx-auto leading-relaxed">
                  We've received your inquiry. Our specialized team will get back to you shortly.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-6 h-full"
              >
                <div className="flex flex-col gap-2 relative">
                  <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Full Name</label>
                  <div className="relative group focus-within:z-10">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      required 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white" 
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 relative">
                  <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Email Address</label>
                  <div className="relative group focus-within:z-10">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      required 
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 flex-1 relative">
                  <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">Your Message</label>
                  <div className="relative group h-full focus-within:z-10">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#4F46E5] transition-colors" />
                    <textarea 
                      placeholder="How can we help?" 
                      required 
                      className="w-full h-full min-h-[140px] pl-12 pr-4 py-4 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-bold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white resize-none"
                    ></textarea>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(79,70,229,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="mt-2 w-full py-4 bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white font-bold rounded-xl flex items-center justify-center gap-2 tracking-wide shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all cursor-pointer"
                >
                  <span className="text-[16px]">Send Message</span>
                  <Send className="w-5 h-5 ml-1" />
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
