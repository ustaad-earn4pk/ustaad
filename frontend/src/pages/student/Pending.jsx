import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../store/authStore'
import { paymentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

export default function Pending() {
  const { user, logout } = useAuthStore()
  const [step, setStep] = useState('status') // status | form | submitted
  const [accountInfo, setAccountInfo] = useState(null)
  const [form, setForm] = useState({ transaction_id: '', sender_number: '', screenshot: null, plan_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadInfo()
    checkStatus()
  }, [])

  async function loadInfo() {
    try {
      const res = await paymentAPI.getAccountInfo()
      setAccountInfo(res.data)
    } catch {}
  }

  async function checkStatus() {
    try {
      const res = await paymentAPI.getMyStatus()
      if (res.data?.length > 0) {
        const latest = res.data[0]
        if (latest.status === 'pending' || latest.status === 'approved') {
          setStep('submitted')
        }
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.transaction_id.trim()) return setError('Transaction ID required.')
    if (!form.sender_number.trim()) return setError('Sender number required.')
    if (!form.screenshot) return setError('Screenshot required.')

    const formData = new FormData()
    formData.append('plan_id', form.plan_id || '')
    formData.append('amount_pkr', 999)
    formData.append('transaction_id', form.transaction_id.trim())
    formData.append('sender_number', form.sender_number.trim())
    formData.append('screenshot_url', form.screenshot)

    setSubmitting(true)
    try {
      await paymentAPI.submitWithFile(formData)
      setStep('submitted')
    } catch (err) {
      setError(err.response?.data?.detail || 'Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-6"
        >
          <UstaadBot expression={step === 'submitted' ? 'thinking' : 'happy'} size={100} />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {user?.full_name?.split(' ')[0]} bhai! 👋
        </h1>

        {/* SUBMITTED STATE */}
        {step === 'submitted' && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xs">
            <div className="card text-center mb-4">
              <div className="text-4xl mb-3">⏳</div>
              <h2 className="font-semibold text-gray-900 mb-2">Payment Under Review</h2>
              <p className="text-gray-500 text-sm">Admin 24 ghante mein verify karega. Thoda wait karo!</p>
            </div>
            <button onClick={logout} className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              Logout
            </button>
          </motion.div>
        )}

        {/* STATUS / PAYMENT INSTRUCTIONS */}
        {step === 'status' && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xs">
            <div className="card mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Step 1 — Payment Bhejo</p>
              <div className="bg-gray-50 rounded-2xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">JazzCash Number</span>
                  <span className="font-mono font-bold text-gray-900">
                    {accountInfo?.jazzcash || '03XX-XXXXXXX'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-green-600">PKR 999</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setStep('form')}
              className="btn-primary w-full py-3"
            >
              Maine Payment Kar Di ✓
            </button>
            <button onClick={logout} className="w-full text-sm text-gray-400 mt-3 text-center">
              Logout
            </button>
          </motion.div>
        )}

        {/* FORM */}
        {step === 'form' && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-xs">
            <div className="card mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-4">Step 2 — Proof Upload Karo</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-3">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN123456789"
                    value={form.transaction_id}
                    onChange={e => setForm({ ...form, transaction_id: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tumhara JazzCash Number</label>
                  <input
                    type="text"
                    placeholder="03XX-XXXXXXX"
                    value={form.sender_number}
                    onChange={e => setForm({ ...form, sender_number: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Screenshot</label>
                  <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-brand-300 transition">
                    {form.screenshot ? (
                      <span className="text-green-600 text-sm font-medium">✓ {form.screenshot.name}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Tap to upload</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setForm({ ...form, screenshot: e.target.files[0] || null })}
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
            <button
              onClick={() => setStep('status')}
              className="w-full text-sm text-gray-400 mt-3 text-center"
            >
              Wapas jao
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
