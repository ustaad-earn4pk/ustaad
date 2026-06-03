import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const fadeUp = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 } }

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur_nastaliq', label: 'اردو' },
  { code: 'ur_roman', label: 'Roman Urdu' },
]

export default function Profile() {
  const { user, logout, setAuth } = useAuthStore()
  const { t, setLanguage } = useLangStore()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [botExpr, setBotExpr] = useState('cool')
  const [activeTab, setActiveTab] = useState('basic')

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    age: '',
    preferred_language: 'en',
    portfolio_url: '',
    education: {
      degree: '',
      institute: '',
      year: ''
    }
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const res = await studentAPI.getProfile()
      const data = res.data
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        age: data.age || '',
        preferred_language: data.preferred_language || 'en',
        portfolio_url: data.portfolio_url || '',
        education: data.education || { degree: '', institute: '', year: '' }
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    setBotExpr('thinking')

    try {
      await studentAPI.updateProfile({
        ...form,
        age: form.age ? parseInt(form.age) : null,
      })
      setSuccess(true)
      setBotExpr('celebrating')

      // Language update karo store mein bhi
      if (form.preferred_language !== user?.preferred_language) {
        setLanguage(form.preferred_language)
        setAuth({ ...user, preferred_language: form.preferred_language }, null)
      }

      setTimeout(() => setBotExpr('cool'), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Update fail ho gaya.')
      setBotExpr('strict')
      setTimeout(() => setBotExpr('cool'), 2000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-brand-600 font-medium text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">
            Logout
          </button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Bot + Name */}
        <motion.div {...fadeUp} className="flex flex-col items-center py-4">
          <UstaadBot expression={botExpr} size={80} />
          <h2 className="text-xl font-bold text-gray-900 mt-3">{profile?.full_name}</h2>
          <p className="text-sm text-brand-600">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-medium">
              Level {profile?.skill_level || 1}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
              {profile?.total_points || 0} pts
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          {[
            { key: 'basic', label: 'Basic Info' },
            { key: 'education', label: 'Education' },
            { key: 'portfolio', label: 'Portfolio' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all
                ${activeTab === tab.key
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Full Name</label>
              <input
                type="text"
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="0321-XXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">City</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Lahore"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Age</label>
                <input
                  type="number"
                  className="input"
                  placeholder="22"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Preferred Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setForm({ ...form, preferred_language: lang.code })}
                    className={`flex-1 py-2 px-2 rounded-xl text-sm font-medium transition-all
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
          </motion.div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <p className="text-xs text-gray-400">Optional — future portfolio mein use hoga</p>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Degree / Qualification</label>
              <input
                type="text"
                className="input"
                placeholder="BSc Computer Science"
                value={form.education?.degree || ''}
                onChange={(e) => setForm({ ...form, education: { ...form.education, degree: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Institute</label>
              <input
                type="text"
                className="input"
                placeholder="University of Punjab"
                value={form.education?.institute || ''}
                onChange={(e) => setForm({ ...form, education: { ...form.education, institute: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Year</label>
              <input
                type="text"
                className="input"
                placeholder="2024"
                value={form.education?.year || ''}
                onChange={(e) => setForm({ ...form, education: { ...form.education, year: e.target.value } })}
              />
            </div>
          </motion.div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3">
              <p className="text-xs text-brand-700 font-medium">🚀 Coming Soon</p>
              <p className="text-xs text-brand-600 mt-1">
                USTAAD aapka automatic portfolio generate karega course complete hone ke baad.
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Portfolio / LinkedIn URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://linkedin.com/in/yourname"
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
              />
            </div>
          </motion.div>
        )}

        {/* Error / Success */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-2xl text-center"
          >
            ✅ Profile update ho gaya!
          </motion.div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              Saving...
            </>
          ) : 'Save Changes'}
        </button>

      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: t('dashboard'), path: '/dashboard' },
            { icon: '📋', label: t('myTasks'), path: '/tasks' },
            { icon: '💬', label: t('chat'), path: '/chat' },
            { icon: '👤', label: t('profile'), path: '/profile', active: true },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
                ${item.active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
