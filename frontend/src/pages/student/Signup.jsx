import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useLangStore } from '../../store/langStore'
import { authAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur_nastaliq', label: 'اردو' },
  { code: 'ur_roman', label: 'Roman Urdu' },
]

export default function Signup() {
  const { t } = useLangStore()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    preferred_language: 'en'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [botExpr, setBotExpr] = useState('welcoming')

  // Bot check
  const formLoadTime = useRef(Date.now() / 1000)
  const [honeypot, setHoneypot] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setBotExpr('thinking')

    try {
      await authAPI.signup({
        ...form,
        website: honeypot,
        form_load_time: formLoadTime.current
      })
      setBotExpr('celebrating')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setBotExpr('strict')
      setError(err.response?.data?.detail || t('error'))
      setTimeout(() => setBotExpr('welcoming'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">

      <div className="flex justify-between items-center p-4">
        <Link to="/login" className="text-brand-600 font-medium text-sm">← Back</Link>
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 flex flex-col items-center"
        >
          <UstaadBot expression={botExpr} size={80} />
          <h1 className="text-xl font-bold text-gray-900 mt-3">Join USTAAD</h1>
          <p className="text-sm text-brand-600 mt-1">Apna safar shuru karein</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Honeypot — invisible to humans */}
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
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('fullName')} *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Muhammad Ali"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('email')} *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="ali@gmail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('password')} *</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Strong password (min 8 characters)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 font-medium mb-1 block">{t('phone')}</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="0321-XXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 font-medium mb-1 block">{t('city')}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Lahore"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">{t('changeLanguage')}</label>
                <div className="flex gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setForm({ ...form, preferred_language: lang.code })}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all
                        ${form.preferred_language === lang.code
                          ? 'bg-brand-400 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${lang.code === 'ur_nastaliq' ? 'font-urdu' : ''}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
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
                {loading ? t('loading') : 'Account Banayein →'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already registered?{' '}
              <Link to="/login" className="text-brand-600 font-medium">{t('login')}</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
