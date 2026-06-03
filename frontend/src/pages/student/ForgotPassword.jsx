import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { authAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [botExpr, setBotExpr] = useState('welcoming')
  const formLoadTime = useRef(Date.now() / 1000)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBotExpr('thinking')

    try {
      await authAPI.forgotPassword({
        email,
        website: honeypot,
        form_load_time: formLoadTime.current
      })
      setBotExpr('excited')
      setSuccess(true)
    } catch (err) {
      setBotExpr('strict')
      setError(err.response?.data?.detail || 'Kuch ghalat hua. Dobara koshish karein.')
      setTimeout(() => setBotExpr('welcoming'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="flex justify-between items-center p-4">
        <Link to="/login" className="text-brand-600 font-medium text-sm">← Back</Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 flex flex-col items-center"
        >
          <UstaadBot expression={botExpr} size={80} />
          <h1 className="text-xl font-bold text-gray-900 mt-3">Password Reset</h1>
          <p className="text-sm text-brand-600 mt-1">Email daalo — link bhej dein ge</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="card">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="text-4xl mb-3">📧</div>
                <p className="text-gray-800 font-medium">Reset link bhej diya!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Apni email check karein aur link pe click karein.
                </p>
                <Link
                  to="/login"
                  className="mt-5 inline-block text-brand-600 font-medium text-sm hover:underline"
                >
                  ← Login pe wapas jayein
                </Link>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    left: '-9999px',
                    height: 0,
                    width: 0,
                    overflow: 'hidden'
                  }}
                />

                <div>
                  <label className="text-sm text-gray-600 font-medium mb-1 block">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="aapki@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl"
                  >
                    {error}
                  </motion.div>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Bhej rahe hain...
                    </span>
                  ) : 'Reset Link Bhejein'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  <Link to="/login" className="text-brand-600 font-medium hover:underline">
                    ← Login pe wapas jayein
                  </Link>
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
