import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI, paymentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 } }

const TRACK_NAMES = {
  computer_basics:    'Computer & Internet Basics',
  web_fundamentals:   'Web & Business Basics',
  ghl_developer:      'GoHighLevel Developer',
  integration_expert: 'Integration Expert',
  full_stack_automation: 'Full Stack Automation',
  client_hunting:     'Client Hunting & Portfolio',
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { t } = useLangStore()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)

  const name = user?.full_name?.split(' ')[0] || 'Student'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [profileRes, paymentRes] = await Promise.all([
        studentAPI.getProfile(),
        paymentAPI.getMyStatus(),
      ])
      setProfile(profileRes.data)
      if (paymentRes.data?.length > 0) setPayment(paymentRes.data[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isApproved = profile?.status === 'approved'
  const currentTrack = profile?.current_track
  const trackName = TRACK_NAMES[currentTrack] || currentTrack

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Assalam o Alaikum,</p>
            <h1 className="text-xl font-bold text-gray-900">{name} bhai! 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button onClick={logout}
              className="w-10 h-10 bg-brand-400 rounded-2xl flex items-center justify-center text-white font-bold"
              title="Logout">
              {name[0]}
            </button>
          </div>
        </div>
      </div>

      <motion.div variants={stagger} initial="initial" animate="animate" className="px-5 pt-5 space-y-4">

        {/* Payment Status Card */}
        {payment && (
          <motion.div variants={fadeUp}>
            {payment.status === 'pending' && (
              <div className="card bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⏳</span>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Payment Under Review</p>
                    <p className="text-xs text-amber-600">Admin 24 ghante mein verify karega</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-700">
                  Amount: PKR {payment.amount_pkr?.toLocaleString()} • TXN: {payment.transaction_id}
                </div>
              </div>
            )}
            {payment.status === 'approved' && (
              <div className="card bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Payment Approved!</p>
                    <p className="text-xs text-green-600">PKR {payment.amount_pkr?.toLocaleString()} verified</p>
                  </div>
                </div>
              </div>
            )}
            {payment.status === 'rejected' && (
              <div className="card bg-red-50 border border-red-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Payment Rejected</p>
                    <p className="text-xs text-red-600">{payment.notes || 'Admin se contact karo'}</p>
                  </div>
                </div>
                <button onClick={() => navigate('/pending')}
                  className="mt-2 text-xs text-red-600 underline">
                  Dobara submit karo
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Current Course Card */}
        {isApproved && currentTrack && (
          <motion.div variants={fadeUp} className="card bg-brand-50 border border-brand-100">
            <p className="text-xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Current Course</p>
            <p className="font-bold text-gray-900">{trackName}</p>
            <div className="mt-2">
              <div className="score-bar">
                <motion.div className="score-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${profile?.progress_pct || 0}%` }}
                  transition={{ duration: 1, delay: 0.3 }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{profile?.progress_pct || 0}% complete</p>
            </div>
          </motion.div>
        )}

        {/* No payment yet */}
        {!payment && !loading && (
          <motion.div variants={fadeUp} className="card border border-dashed border-gray-200 text-center py-6">
            <p className="text-2xl mb-2">📚</p>
            <p className="font-semibold text-gray-900 mb-1">Course enroll nahi kiya abhi</p>
            <p className="text-sm text-gray-500 mb-3">Onboarding complete karo aur course select karo</p>
            <button onClick={() => navigate('/onboarding')} className="btn-primary py-2 px-4 text-sm">
              Onboarding Shuru Karo
            </button>
          </motion.div>
        )}

        {/* Streak + Stats */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-gray-500">{t('streak')}</p>
                <p className="text-lg font-bold text-gray-900">{profile?.current_streak_days || 0} days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{t('level')}</p>
              <p className="text-lg font-bold text-brand-600">Level {profile?.skill_level || 1}</p>
            </div>
          </div>
        </motion.div>

        {/* Bot greeting */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-start gap-3">
            <UstaadBot expression="welcoming" size={50} />
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                {isApproved
                  ? `${name} bhai, aapka course start ho gaya! Aaj ka task check karo. 🎓`
                  : `${name} bhai, USTAAD mein aapka khairmaqdid! Course enroll karo aur seekhna shuru karo. 🚀`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Overview</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tasks', value: profile?.total_tasks_assigned || 0, icon: '📋' },
              { label: t('points'), value: profile?.total_points || 0, icon: '⭐' },
              { label: 'Score', value: profile?.average_score ? `${profile.average_score}%` : '-', icon: '📊' },
            ].map((stat, i) => (
              <div key={i} className="card text-center">
                <p className="text-xl mb-1">{stat.icon}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: t('dashboard'), path: '/dashboard', active: true },
            { icon: '📋', label: t('myTasks'), path: '/tasks' },
            { icon: '💬', label: t('chat'), path: '/chat' },
            { icon: '👤', label: t('profile'), path: '/profile' },
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
