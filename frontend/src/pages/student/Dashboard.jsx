import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI, paymentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import NotificationBell from '../../components/NotificationBell'

const stagger = { animate: { transition: { staggerChildren: 0.09 } } }
const fadeUp = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }

const TRACK_NAMES = {
  computer_basics:       'Computer & Internet Basics',
  web_fundamentals:      'Web & Business Basics',
  ghl_developer:         'GoHighLevel Developer',
  integration_expert:    'Integration Expert',
  full_stack_automation: 'Full Stack Automation',
  client_hunting:        'Client Hunting & Portfolio',
}

const TRACK_LEVELS = {
  computer_basics: 1, web_fundamentals: 2, ghl_developer: 3,
  integration_expert: 4, full_stack_automation: 5, client_hunting: 5,
}

const LAST_LEVEL = 5

// ── Notification Strip ────────────────────────────────────────────────────────
function NotificationStrip({ alerts }) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (alerts.length <= 1) return
    const timer = setInterval(() => {
      setCurrent(i => (i + 1) % alerts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [alerts.length])

  if (!alerts.length) return null

  const alert = alerts[current]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mx-5 mt-4"
    >
      <AnimatePresence mode="wait">
        <motion.button
          key={current}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          onClick={() => alert.action && navigate(alert.action)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all
            ${alert.type === 'danger' ? 'bg-red-500' :
              alert.type === 'warning' ? 'bg-amber-500' :
              alert.type === 'info' ? 'bg-blue-500' :
              'bg-gray-800'} text-white`}
        >
          <span className="text-base flex-shrink-0">{alert.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{alert.title}</p>
            {alert.sub && <p className="text-xs opacity-80 truncate">{alert.sub}</p>}
          </div>
          {alert.action && <span className="text-xs opacity-70 flex-shrink-0">→</span>}
          {alerts.length > 1 && (
            <div className="flex gap-1 flex-shrink-0">
              {alerts.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </motion.button>
      </AnimatePresence>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { t } = useLangStore()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [payment, setPayment] = useState(null)
  const [expiry, setExpiry] = useState(null)
  const [streakWarning, setStreakWarning] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)

  const name = user?.full_name?.split(' ')[0] || 'Student'

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      navigate('/admin', { replace: true })
      return
    }
    loadData()
  }, [])

  async function loadData() {
    try {
      const [profileRes, paymentRes, expiryRes, streakRes] = await Promise.all([
        studentAPI.getProfile(),
        paymentAPI.getMyStatus(),
        studentAPI.getExpiryStatus(),
        studentAPI.getStreakWarning(),
      ])
      setProfile(profileRes.data)
      if (paymentRes.data?.length > 0) setPayment(paymentRes.data[0])
      setExpiry(expiryRes.data)
      setStreakWarning(streakRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => setDataReady(true), 50)
    }
  }

  const isApproved = profile?.status === 'approved'
  const currentTrack = profile?.current_track
  const trackName = TRACK_NAMES[currentTrack] || currentTrack
  const currentLevel = TRACK_LEVELS[currentTrack] || 1
  const isLastLevel = currentLevel >= LAST_LEVEL
  const nextTrack = expiry?.next_track
  const nextTrackName = TRACK_NAMES[nextTrack] || nextTrack
  const badges = profile?.streak_badges || []
  const latestBadge = badges.length > 0 ? badges[badges.length - 1] : null

  // Build alerts array for notification strip
  const alerts = []
  if (streakWarning?.warning) {
    alerts.push({
      icon: streakWarning.freeze_available ? '🔥' : '🚨',
      title: streakWarning.message,
      sub: 'Task submit karo — streak bachao',
      type: streakWarning.freeze_available ? 'warning' : 'danger',
      action: '/tasks'
    })
  }
  if (expiry?.expiry_status && isApproved) {
    const daysLeft = expiry.expiry_status === 'grace' ? expiry.grace_days_left : expiry.days_left
    alerts.push({
      icon: expiry.expiry_status === 'grace' ? '⛔' : expiry.days_left <= 1 ? '🚨' : expiry.days_left <= 3 ? '🔔' : '⚠️',
      title: expiry.expiry_status === 'grace' ? `Grace period — ${daysLeft} din bacha` : `Subscription — ${daysLeft} din bacha`,
      sub: !isLastLevel && nextTrack ? `Next: ${nextTrackName}` : 'Renew karo',
      type: expiry.days_left <= 1 || expiry.expiry_status === 'grace' ? 'danger' : 'warning',
      action: '/renewal'
    })
  }
  if (payment?.status === 'pending') {
    alerts.push({
      icon: '⏳',
      title: 'Payment review mein hai',
      sub: `PKR ${payment.amount_pkr?.toLocaleString()} • TXN: ${payment.transaction_id}`,
      type: 'info',
      action: null
    })
  }
  if (payment?.status === 'rejected') {
    alerts.push({
      icon: '❌',
      title: 'Payment reject ho gayi',
      sub: payment.notes || 'Admin se contact karo',
      type: 'danger',
      action: '/pending'
    })
  }

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
            <NotificationBell />
            <button onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-brand-400 rounded-2xl flex items-center justify-center text-white font-bold"
              title="Profile">
              {name[0]}
            </button>
            <button onClick={logout}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Strip */}
      {dataReady && <NotificationStrip alerts={alerts} />}

      {/* Loading skeleton */}
      {loading && (
        <div className="px-5 pt-5 space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-20" />
          ))}
        </div>
      )}

      {/* Main content */}
      <AnimatePresence>
        {dataReady && (
          <motion.div
            key="dashboard-content"
            variants={stagger}
            initial="initial"
            animate="animate"
            className="px-5 pt-4 space-y-4"
          >

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
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{profile?.progress_pct || 0}% complete</p>
                </div>
              </motion.div>
            )}

            {/* No payment yet */}
            {!payment && (
              <motion.div variants={fadeUp} className="card border border-dashed border-gray-200 text-center py-6">
                <p className="text-2xl mb-2">📚</p>
                <p className="font-semibold text-gray-900 mb-1">Course enroll nahi kiya abhi</p>
                <p className="text-sm text-gray-500 mb-3">Onboarding complete karo aur course select karo</p>
                <button onClick={() => navigate('/onboarding')} className="btn-primary py-2 px-4 text-sm">
                  Onboarding Shuru Karo
                </button>
              </motion.div>
            )}

            {/* Streak + Level */}
            <motion.div variants={fadeUp} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-xs text-gray-500">{t('streak')}</p>
                    <p className="text-lg font-bold text-gray-900">{profile?.current_streak || 0} days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{t('level')}</p>
                  <p className="text-lg font-bold text-brand-600">Level {profile?.skill_level || 1}</p>
                </div>
              </div>
              {latestBadge && (
                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
                  <span className="text-xl">{latestBadge.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{latestBadge.label}</p>
                    <p className="text-xs text-gray-400">Earned {latestBadge.earned_at}</p>
                  </div>
                </div>
              )}
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
        )}
      </AnimatePresence>

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
