import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useLangStore } from '../../store/langStore'
import { useAuthStore } from '../../store/authStore'
import { authAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

export default function Login() {
  const { t } = useLangStore()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botExpr, setBotExpr] = useState('welcoming')

  // Bot check state
  const formLoadTime = useRef(Date.now() / 1000)  // Unix timestamp in seconds
  const [honeypot, setHoneypot] = useState('')     // Must stay empty

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBotExpr('thinking')

    try {
      const res = await authAPI.login({
        ...form,
        website: honeypot,
        form_load_time: formLoadTime.current
      })

      const { access_token, user_id, role, full_name, preferred_language, status, onboarding_status } = res.data
      setAuth({ id: user_id, role, full_name, preferred_language, status, onboarding_status }, access_token)
      setBotExpr('excited')

      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin')
        } else if (onboarding_status !== 'completed') {
          navigate('/onboarding')
        } else if (status === 'pending') {
          navigate('/pending')
        } else {
          navigate('/dashboard')
        }
      }, 500)

    } catch (err) {
      setBotExpr('strict')
      const msg = err.response?.data?.detail || t('error')
      setError(msg)
      setTimeout(() => setBotExpr('welcoming'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-col items-center"
        >
          <UstaadBot expression={botExpr} size={100} />
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-gray-900 mt-4"
          >
            USTAAD
          </motion.h1>
          <p className="text-brand-600 font-medium text-sm mt-1">
            {t('tagline')}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('login')}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Honeypot — bots fill this, humans don't see it */}
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
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('email')}</label>
                <input
                  type="email"
                  className="input"
                  placeholder="aapki@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('password')}</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    {t('loading')}
                  </>
                ) : t('login')}
              </button>
            </form>

            <div className="flex items-center justify-between mt-5">
              <p className="text-sm text-gray-500">
                Account nahi hai?{' '}
                <Link to="/signup" className="text-brand-600 font-medium hover:underline">
                  {t('signup')}
                </Link>
              </p>
              <Link to="/forgot-password" className="text-sm text-brand-600 font-medium hover:underline">
               {t('forgotPassword')}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
