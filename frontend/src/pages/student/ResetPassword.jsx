import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { authAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botExpr, setBotExpr] = useState('welcoming')
  const [accessToken, setAccessToken] = useState('')
  const formLoadTime = useRef(Date.now() / 1000)

  useEffect(() => {
    // Supabase reset link mein token hash mein aata hai: #access_token=xxx
    const hash = location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const token = params.get('access_token')
    if (token) {
      setAccessToken(token)
    } else {
      setError('Invalid ya expired reset link.')
      setBotExpr('strict')
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords match nahi kar rahe.')
      setBotExpr('strict')
      return
    }
    if (password.length < 8) {
      setError('Password kam az kam 8 characters ka hona chahiye.')
      return
    }

    setLoading(true)
    setError('')
    setBotExpr('thinking')

    try {
      await authAPI.resetPassword({
        access_token: accessToken,
        new_password: password,
        website: honeypot,
        form_load_time: formLoadTime.current
      })
      setBotExpr('celebrating')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setBotExpr('strict')
      setError(err.response?.data?.detail || 'Reset fail ho gaya. Dobara koshish karein.')
      setTimeout(() => setBotExpr('welcoming'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 flex flex-col items-center"
        >
          <UstaadBot expression={botExpr} size={80} />
          <h1 className="text-xl font-bold text-gray-900 mt-3">Naya Password</h1>
          <p className="text-sm text-brand-600 mt-1">Apna naya password set karein</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="card">
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
                <label className="text-sm text-gray-600 font-medium mb-1 block">Naya Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Dobara likhein"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
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

              {botExpr === 'celebrating' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-2xl text-center"
                >
                  Password update ho gaya! Login pe ja rahe hain...
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !accessToken || botExpr === 'celebrating'}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Update ho raha hai...
                  </span>
                ) : 'Password Update Karein'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
