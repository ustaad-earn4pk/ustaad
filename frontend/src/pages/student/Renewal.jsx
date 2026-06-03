import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useLangStore } from '../../store/langStore'
import { paymentAPI, studentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const fadeUp = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 } }

export default function Renewal() {
  const { t } = useLangStore()
  const navigate = useNavigate()

  const [options, setOptions] = useState([])
  const [selected, setSelected] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    transaction_id: '',
    sender_number: '',
    screenshot: null,
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [optionsRes, accountRes] = await Promise.all([
        paymentAPI.getRenewalOptions(),
        paymentAPI.getAccountInfo(),
      ])
      setOptions(optionsRes.data.options || [])
      setAccountInfo(accountRes.data)

      // Auto-select agar sirf ek option hai
      if (optionsRes.data.options?.length === 1) {
        setSelected(optionsRes.data.options[0])
      }
    } catch (err) {
      setError('Options load nahi ho sake. Wapas jao.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!selected) return setError('Pehle option select karo.')
    if (!form.transaction_id) return setError('Transaction ID zaroori hai.')
    if (!form.sender_number) return setError('Sender number zaroori hai.')
    if (!form.screenshot) return setError('Screenshot zaroori hai.')
    if (selected.pending) return setError('Ye renewal already pending hai. Admin verify kar raha hai.')

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('renewal_type', selected.type)
      formData.append('transaction_id', form.transaction_id)
      formData.append('sender_number', form.sender_number)
      formData.append('screenshot', form.screenshot)

      await paymentAPI.submitRenewal(formData)
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit fail ho gaya. Dobara try karo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
        <motion.div {...fadeUp} className="text-center">
          <UstaadBot expression="celebrating" size={100} />
          <h2 className="text-2xl font-bold text-gray-900 mt-4">Renewal Submit Ho Gaya! 🎉</h2>
          <p className="text-sm text-gray-500 mt-2">Admin 24 ghante mein verify karega — tab tak access jaari rahega.</p>
          <button onClick={() => navigate('/dashboard')}
            className="mt-6 btn-primary py-3 px-8">
            Dashboard Pe Jao
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-lg font-bold text-gray-900">Course Renewal</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Bot message */}
        <motion.div {...fadeUp} className="card">
          <div className="flex items-start gap-3">
            <UstaadBot expression="encouraging" size={50} />
            <p className="text-sm text-gray-700 leading-relaxed pt-1">
              Renewal ke liye option select karo aur payment screenshot upload karo. Admin verify karne ke baad access continue ho jayega. ✅
            </p>
          </div>
        </motion.div>

        {/* Renewal Options */}
        {options.length === 0 ? (
          <motion.div {...fadeUp} className="card text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-gray-900">Koi renewal option available nahi</p>
            <p className="text-sm text-gray-500 mt-1">Aap already highest level pe hain ya course active hai.</p>
            <button onClick={() => navigate('/dashboard')} className="mt-4 btn-primary py-2 px-6 text-sm">
              Dashboard Pe Jao
            </button>
          </motion.div>
        ) : (
          <motion.div {...fadeUp} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">Option Select Karo</p>
            {options.map((option) => (
              <button key={option.type} onClick={() => !option.pending && setSelected(option)}
                className={`w-full text-left card border-2 transition-all ${
                  selected?.type === option.type
                    ? 'border-brand-400 bg-brand-50'
                    : option.pending
                    ? 'border-gray-100 bg-gray-50 opacity-60'
                    : 'border-gray-100 hover:border-brand-200'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                    {option.pending && (
                      <p className="text-xs text-amber-600 mt-1">⏳ Already pending — admin verify kar raha hai</p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-brand-600">PKR {option.price_pkr?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{option.duration_days} din</p>
                  </div>
                </div>
                {selected?.type === option.type && (
                  <div className="mt-2 pt-2 border-t border-brand-100">
                    <p className="text-xs text-brand-600 font-medium">✓ Selected</p>
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Payment Info */}
        {selected && !selected.pending && accountInfo && (
          <motion.div {...fadeUp} className="card bg-blue-50 border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">Payment Info</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">JazzCash:</span>
                <span className="font-bold text-gray-900">{accountInfo.jazzcash}</span>
              </div>
              {accountInfo.easypaisa && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">EasyPaisa:</span>
                  <span className="font-bold text-gray-900">{accountInfo.easypaisa}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-brand-600">PKR {selected.price_pkr?.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment Form */}
        {selected && !selected.pending && (
          <motion.div {...fadeUp} className="card space-y-4">
            <p className="text-sm font-semibold text-gray-700">Payment Details</p>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Transaction ID</label>
              <input type="text" className="input" placeholder="TXN123456"
                value={form.transaction_id}
                onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Sender Number</label>
              <input type="tel" className="input" placeholder="0312-XXXXXXX"
                value={form.sender_number}
                onChange={(e) => setForm({ ...form, sender_number: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Payment Screenshot</label>
              <input type="file" accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700"
                onChange={(e) => setForm({ ...form, screenshot: e.target.files[0] })} />
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">
            {error}
          </motion.div>
        )}

        {/* Submit Button */}
        {selected && !selected.pending && (
          <button onClick={handleSubmit} disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Submitting...</>
            ) : `Renewal Submit Karo — PKR ${selected?.price_pkr?.toLocaleString()}`}
          </button>
        )}

      </div>
    </div>
  )
}
