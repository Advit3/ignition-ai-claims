import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, UploadCloud, Loader2 } from 'lucide-react'
import axiosInstance from '../api/axiosInstance'
import ClaimProcessingOverlay from './ClaimProcessingOverlay'

const uploadToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'seedha_claim_upload')
  formData.append('cloud_name', 'dmzzq2219')
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dmzzq2219/image/upload',
    { method: 'POST', body: formData }
  )
  const data = await response.json()
  if (!data.secure_url) throw new Error('Upload failed')
  return data.secure_url
}

function FileUploadBox({ id, label, required, hint, fileData, onChange, isPrimary }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        setError('Max size 10MB')
        return
      }
      setError('')
      setIsUploading(true)
      try {
        const url = await uploadToCloudinary(file)
        onChange({ name: file.name, secure_url: url }, isPrimary)
      } catch (err) {
        setError('File upload failed, please try again')
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 relative">
      <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5 flex flex-wrap items-center gap-1 sm:gap-2">
        <span>{label} {required && <span className="text-red-500">*</span>}</span>
        {hint && <span className="lowercase normal-case font-medium text-[10px] text-[#9CA3AF]">({hint})</span>}
      </label>
      <div className="relative group cursor-pointer w-full">
        <input 
          type="file" 
          id={id}
          className="hidden" 
          onChange={handleFile}
          accept=".jpg,.jpeg,.png,.pdf"
        />
        <label 
          htmlFor={id} 
          className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border ${fileData ? 'border-[#10B981] bg-[#10B981]/5' : error ? 'border-red-300 bg-red-50' : 'border-[#D1D9E0] bg-[#F8FAFC]'} hover:border-[#4F46E5] transition-colors cursor-pointer group-focus-within:border-[#4F46E5]`}
        >
          <div className="flex items-center gap-3 overflow-hidden pr-2">
            {isUploading ? (
               <Loader2 className="w-5 h-5 shrink-0 text-[#4F46E5] animate-spin" />
            ) : (
               <UploadCloud className={`w-5 h-5 shrink-0 transition-colors ${fileData ? 'text-[#10B981]' : error ? 'text-red-400' : 'text-[#9CA3AF] group-hover:text-[#4F46E5]'}`} />
            )}
            <span className={`text-sm tracking-wide truncate font-semibold transition-colors ${fileData ? 'text-[#111827]' : error ? 'text-red-500' : 'text-[#9CA3AF] group-hover:text-[#6B7280]'}`}>
               {isUploading ? 'Uploading...' : fileData ? fileData.name : error ? error : 'Choose file (Max 10MB)'}
            </span>
          </div>
          {fileData && !isUploading && <span className="text-xs font-bold text-[#10B981] flex items-center gap-1 shrink-0"><CheckCircle2 className="w-4 h-4"/> Uploaded</span>}
        </label>
      </div>
    </div>
  )
}

export default function GadgetClaim({ onComplete }) {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    policyNumber: '', imei: '',
    deviceType: '', brand: '', modelName: '', purchaseDate: '', invoiceNumber: '', deviceValue: '',
    issueType: '', incidentDate: '', incidentDescription: '', incidentLocation: '',
    claimType: '', estimatedLoss: '',
    declaration: false
  })

  const [documents, setDocuments] = useState({
    purchaseInvoice: null,
    devicePhotos: null,
    repairEstimate: null,
    firCopy: null
  })

  const [documentUrl, setDocumentUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [apiResponse, setApiResponse] = useState(null)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const userUser = JSON.parse(localStorage.getItem("user"))
    if (userUser) {
      setFormData(prev => ({ 
        ...prev, 
        fullName: userUser.name || '', 
        email: userUser.email || '' 
      }))
    }
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDocChange = (field, docObj, isPrimary) => {
    setDocuments(prev => ({ ...prev, [field]: docObj }))
    if (isPrimary && docObj?.secure_url) {
      setDocumentUrl(docObj.secure_url)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!documentUrl) {
      setSubmitError('Please upload a document before submitting')
      return
    }

    const payload = {
      claim_type: 'Gadget Insurance',
      claim_amount: parseFloat(formData.estimatedLoss || formData.deviceValue) || 0,
      document_url: documentUrl,
      description: formData.incidentDescription || 'Gadget insurance claim',
    }

    setIsProcessing(true)
    setApiResponse(null)

    try {
      const [response] = await Promise.all([
        axiosInstance.post('/api/v1/claims/submit', payload),
        new Promise(resolve => setTimeout(resolve, 3500))
      ])
      setApiResponse(response.data.data)
    } catch (err) {
      setApiResponse({ claim_status: 'error', status_reason: err.response?.data?.message || 'Submission failed' })
    }
  }

  const handleReset = () => {
    setFormData({
      fullName: '', email: '', phone: '',
      policyNumber: '', imei: '',
      deviceType: '', brand: '', modelName: '', purchaseDate: '', invoiceNumber: '', deviceValue: '',
      issueType: '', incidentDate: '', incidentDescription: '', incidentLocation: '',
      claimType: '', estimatedLoss: '',
      declaration: false
    })
    setDocuments({ purchaseInvoice: null, devicePhotos: null, repairEstimate: null, firCopy: null })
    setDocumentUrl('')
    setIsProcessing(false)
    setApiResponse(null)
    setSubmitError('')
    const userUser = JSON.parse(localStorage.getItem("user"))
    if (userUser) setFormData(prev => ({ ...prev, fullName: userUser.name || '', email: userUser.email || '' }))
  }

  if (isProcessing) {
    return <ClaimProcessingOverlay apiResponse={apiResponse} onReset={handleReset} />
  }

  const InputField = ({ label, type="text", field, placeholder, required=true, prefix }) => (
     <div className="flex flex-col gap-2 relative">
       <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
       <div className="relative flex items-center">
         {prefix && <span className="absolute left-4 font-bold text-[#9CA3AF] z-10">{prefix}</span>}
         <input 
           type={type} 
           required={required}
           value={formData[field]}
           placeholder={placeholder}
           onChange={(e) => handleChange(field, e.target.value)}
           className={`w-full py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-semibold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white placeholder-[#9CA3AF] ${prefix ? 'pl-9 pr-4' : 'px-4'}`}
         />
       </div>
     </div>
  )

  const SelectField = ({ label, field, options, required=true }) => (
     <div className="flex flex-col gap-2">
       <label className="text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
       <select 
         required={required}
         value={formData[field]}
         onChange={(e) => handleChange(field, e.target.value)}
         className="w-full px-4 py-3.5 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-semibold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white appearance-none cursor-pointer"
       >
         <option value="" disabled>Select {label}</option>
         {options.map(o => <option key={o} value={o}>{o}</option>)}
       </select>
     </div>
  )

  const requiresPhotos = ["Accidental Damage", "Screen Damage", "Water Damage"].includes(formData.issueType)
  const requiresEstimate = ["Accidental Damage", "Screen Damage"].includes(formData.issueType)
  const requiresFir = ["Theft"].includes(formData.issueType)

  return (
    <div className="w-full h-full overflow-y-auto flex flex-col items-center justify-start py-6 sm:py-10 px-2 sm:px-6">
       <motion.div
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, ease: 'easeOut' }}
         className="w-full max-w-[850px] bg-[#FFFFFF] border border-[#D1D9E0] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden shrink-0 mb-10"
       >
          <div className="p-8 sm:p-10 border-b border-[#D1D9E0]/60 bg-[#FFFFFF]">
             <h1 className="text-3xl font-black text-[#111827] tracking-tight mb-2">Gadget Insurance Claim</h1>
             <p className="text-[#6B7280] font-semibold text-sm">Submit your device damage, theft, or malfunction claim quickly and securely.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 sm:p-10 flex flex-col gap-12">
             
             {/* SECTION 1 */}
             <div>
               <h3 className="text-[#111827] font-bold text-lg tracking-tight border-b border-[#D1D9E0]/50 pb-2 mb-6">1. User & Policy Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <InputField label="Full Name" field="fullName" placeholder="John Doe" />
                 <InputField label="Email Address" field="email" type="email" placeholder="john@example.com" />
                 <InputField label="Phone Number" field="phone" type="tel" placeholder="+91 98765 43210" />
                 <div className="hidden md:block"></div>
                 <InputField label="Policy Number / Plan ID" field="policyNumber" placeholder="POL-1234567" required={true} />
                 <InputField label="IMEI / Serial Number" field="imei" placeholder="15-digit IMEI or S/N" required={true} />
               </div>
             </div>

             {/* SECTION 2 */}
             <div>
               <h3 className="text-[#111827] font-bold text-lg tracking-tight border-b border-[#D1D9E0]/50 pb-2 mb-6">2. Device Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <SelectField label="Device Type" field="deviceType" options={["Mobile", "Laptop", "Tablet", "Other"]} />
                 <InputField label="Brand" field="brand" placeholder="e.g. Apple, Samsung" />
                 <InputField label="Model Name" field="modelName" placeholder="e.g. iPhone 14 Pro" />
                 <InputField label="Invoice Number" field="invoiceNumber" placeholder="INV-123456" />
                 <InputField label="Purchase Date" field="purchaseDate" type="date" />
                 <InputField label="Device Value" field="deviceValue" type="number" placeholder="0.00" prefix="₹" />
               </div>
             </div>

             {/* SECTION 3 */}
             <div>
               <h3 className="text-[#111827] font-bold text-lg tracking-tight border-b border-[#D1D9E0]/50 pb-2 mb-6">3. Incident Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <SelectField label="Issue Type" field="issueType" options={["Accidental Damage", "Theft", "Water Damage", "Screen Damage", "Other"]} />
                 <InputField label="Incident Date" field="incidentDate" type="date" />
                 <div className="md:col-span-2">
                   <InputField label="Location of Incident" field="incidentLocation" placeholder="Full address or area" />
                 </div>
                 <div className="md:col-span-2 relative">
                   <label className="flex text-xs font-black text-[#6B7280] uppercase tracking-wider pl-1.5 mb-2">Incident Description <span className="text-red-500 ml-1">*</span></label>
                   <textarea required value={formData.incidentDescription} onChange={(e) => handleChange('incidentDescription', e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#D1D9E0] outline-none text-sm text-[#111827] font-semibold focus:border-[#4F46E5] focus:ring-[2px] focus:ring-[#4F46E5]/15 shadow-[0_2px_4px_rgba(0,0,0,0.01)] transition-all bg-white min-h-[100px] resize-none" placeholder="Explain exactly how the device was damaged or lost..."></textarea>
                 </div>
               </div>
             </div>

             {/* SECTION 4 */}
             <div>
               <h3 className="text-[#111827] font-bold text-lg tracking-tight border-b border-[#D1D9E0]/50 pb-2 mb-6">4. Claim Details</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <SelectField label="Claim Type" field="claimType" options={["Repair", "Replacement", "Reimbursement"]} />
                 <InputField label="Estimated Loss Amount" field="estimatedLoss" type="number" placeholder="0.00" prefix="₹" />
               </div>
             </div>

             {/* SECTION 5 */}
             <div>
               <h3 className="text-[#111827] font-bold text-lg tracking-tight border-b border-[#D1D9E0]/50 pb-2 mb-6 flex flex-wrap items-center justify-between gap-4">
                 <span>5. Document Upload</span>
                 <span className="text-xs font-bold text-[#4F46E5] bg-[#4F46E5]/10 px-3 py-1.5 rounded-full shrink-0">
                    {formData.issueType ? 'Context Activated' : 'Select Issue Type'}
                 </span>
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 <div className="md:col-span-2">
                   <FileUploadBox id="d_inv" label="Purchase Invoice" required={true} isPrimary={true} hint="Common required document" fileData={documents.purchaseInvoice} onChange={(f, isPrimary) => handleDocChange('purchaseInvoice', f, isPrimary)} />
                 </div>

                 <AnimatePresence>
                   {(requiresPhotos || requiresEstimate) && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 overflow-hidden mt-2 flex flex-col gap-6">
                        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-6 shadow-sm flex flex-col gap-6">
                           {requiresPhotos && (
                             <FileUploadBox id="d_photos" label="Device Photos" hint="Clear photos showing damage" required={true} isPrimary={false} fileData={documents.devicePhotos} onChange={(f, isPrimary) => handleDocChange('devicePhotos', f, isPrimary)} />
                           )}
                           {requiresEstimate && (
                             <FileUploadBox id="d_est" label="Repair Estimate" hint="Quotation from authorized service center" required={true} isPrimary={false} fileData={documents.repairEstimate} onChange={(f, isPrimary) => handleDocChange('repairEstimate', f, isPrimary)} />
                           )}
                        </div>
                     </motion.div>
                   )}
                   {requiresFir && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:col-span-2 overflow-hidden mt-2">
                        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-6 shadow-sm">
                           <FileUploadBox id="d_fir" label="FIR Copy" hint="Required for stolen devices" required={true} isPrimary={false} fileData={documents.firCopy} onChange={(f, isPrimary) => handleDocChange('firCopy', f, isPrimary)} />
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>

             {/* Declaration */}
             <div className="mt-4 bg-[#F8FAFC] border border-[#D1D9E0] p-6 rounded-xl">
               <label className="flex items-start gap-4 cursor-pointer group">
                 <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                   <input required type="checkbox" checked={formData.declaration} onChange={(e) => handleChange('declaration', e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-[#D1D9E0] rounded-md checked:bg-[#4F46E5] checked:border-[#4F46E5] transition-colors cursor-pointer" />
                   <CheckCircle2 className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                 </div>
                 <span className="text-sm font-bold text-[#6B7280] leading-snug group-hover:text-[#111827] transition-colors">
                   I hereby declare that the information provided is true and correct. I understand any false statements may result in claim rejection.
                 </span>
               </label>
             </div>

             {submitError && (
               <div className="bg-[#FEF2F2] border border-[#FCA5A5] px-4 py-3 rounded-xl">
                 <span className="text-sm font-semibold text-[#DC2626]">{submitError}</span>
               </div>
             )}

             <div className="pt-6 border-t border-[#D1D9E0]/50 flex justify-end">
               <motion.button
                 whileHover={{ scale: 1.01, boxShadow: '0 8px 25px rgba(79,70,229,0.2)' }}
                 whileTap={{ scale: 0.98 }}
                 type="submit"
                 className="w-full sm:w-auto px-16 py-4 bg-[#4F46E5] text-white font-bold rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.1)] transition-all cursor-pointer text-base tracking-wide"
               >
                 Submit Claim
               </motion.button>
             </div>
          </form>
       </motion.div>
    </div>
  )
}
