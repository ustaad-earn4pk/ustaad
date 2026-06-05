import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI, paymentAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import NotificationBell from '../../components/NotificationBell'

const stagger = { animate: { transition: { staggerChildren: 0.08 } } }
const fadeUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

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

function NotificationStrip({ alerts }) {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (alerts.length <= 1) return
    const timer = setInterval(() => setCurrent(i => (i + 1) % alerts.length), 4000)
    return () => clearInterval(timer)
  }, [alerts.length])

  if (!alerts.length) return null
  const alert = alerts[current]

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="px-5 mt-3">
      <AnimatePresence mode="wait">
        <motion.button key={current}
          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.25 }}
          onClick={() => alert.action && navigate(alert.action)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left
            ${alert.type === 'danger' ? 'bg-red-500' :
              alert.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'} text-white`}>
          <span className="text-sm">{alert.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{alert.title}</p>
            {alert.sub && <p className="text-xs opacity-75 truncate">{alert.sub}</p>}
          </div>
          {alert.action && <span className="text-xs opacity-60 flex-shrink-0">›</span>}
          {alerts.length > 1 && (
            <div className="flex gap-1">
              {alerts.map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full ${i === current ? 'bg-white' : 'bg-white/40'}`} />
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
      setTimeout(() => setDataReady(true), 60)
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

  const alerts = []
  if (streakWarning?.warning) alerts.push({
    icon: '🔥', title: streakWarning.message,
    sub: 'Task submit karo', type: 'warning', action: '/tasks'
  })
  if (expiry?.expiry_status && isApproved) alerts.push({
    icon: expiry.expiry_status === 'grace' ? '⛔' : '⚠️',
    title: expiry.expiry_status === 'grace'
      ? `Grace period — ${expiry.grace_days_left} din`
      : `Subscription — ${expiry.days_left} din bacha`,
    sub: !isLastLevel && nextTrack ? `Next: ${nextTrackName}` : 'Renew karo',
    type: expiry.days_left <= 3 || expiry.expiry_status === 'grace' ? 'danger' : 'warning',
    action: '/renewal'
  })
  if (payment?.status === 'pending') alerts.push({
    icon: '⏳', title: 'Payment review mein',
    sub: `PKR ${payment.amount_pkr?.toLocaleString()}`, type: 'info', action: null
  })
  if (payment?.status === 'rejected') alerts.push({
    icon: '❌', title: 'Payment reject', sub: 'Dobara submit karo', type: 'danger', action: '/pending'
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-5 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium tracking-wide">Assalam o Alaikum</p>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{name} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <NotificationBell />
            <button onClick={() => navigate('/profile')}
              className="w-10 h-10 bg-brand-400 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {name[0]}
            </button>
            <button onClick={logout}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
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

      {/* Loading */}
      {loading && (
        <div className="px-5 pt-5 space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl" style={{ height: i === 0 ? 120 : 80 }} />
          ))}
        </div>
      )}

      {/* Content */}
      <AnimatePresence>
        {dataReady && (
          <motion.div key="content" variants={stagger} initial="initial" animate="animate"
            className="px-5 pt-4 space-y-3">

            {/* Hero card — Course + Stats */}
            {isApproved && currentTrack ? (
              <motion.div variants={fadeUp}
                className="rounded-3xl bg-brand-400 p-5 text-white shadow-lg shadow-brand-400/20">
                <p className="text-xs font-medium opacity-70 uppercase tracking-widest mb-1">Current Course</p>
                <p className="text-lg font-bold leading-tight mb-4">{trackName}</p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs opacity-70">Progress</p>
                    <p className="text-xs font-semibold">{profile?.progress_pct || 0}%</p>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${profile?.progress_pct || 0}%` }}
                      transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Tasks', value: profile?.total_tasks_assigned || 0 },
                    { label: 'Points', value: profile?.total_points || 0 },
                    { label: 'Score', value: profile?.average_score ? `${Math.round(profile.average_score)}%` : '—' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl px-3 py-2 text-center">
                      <p className="text-base font-bold">{s.value}</p>
                      <p className="text-xs opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : !payment && (
              <motion.div variants={fadeUp}
                className="rounded-3xl border-2 border-dashed border-gray-200 p-6 text-center bg-white">
                <p className="text-2xl mb-2">📚</p>
                <p className="font-semibold text-gray-900 mb-1 text-sm">Course enroll nahi kiya</p>
                <p className="text-xs text-gray-400 mb-3">Onboarding complete karo</p>
                <button onClick={() => navigate('/onboarding')}
                  className="btn-primary py-2 px-4 text-xs">
                  Shuru Karo
                </button>
              </motion.div>
            )}

            {/* Streak + Level + Badge */}
            <motion.div variants={fadeUp}
              className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Day Streak</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🔥</span>
                  <p className="text-2xl font-bold text-gray-900">{profile?.current_streak || 0}</p>
                  <p className="text-xs text-gray-400 self-end mb-0.5">days</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Level</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">⭐</span>
                  <p className="text-2xl font-bold text-brand-400">{profile?.skill_level || 1}</p>
                </div>
              </div>
            </motion.div>

            {/* Bot message */}
            <motion.div variants={fadeUp}
              className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
              <UstaadBot expression="welcoming" size={44} />
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                {isApproved
                  ? `${name}, aaj ka task check karo aur streak maintain karo! 🎯`
                  : `${name}, USTAAD mein khush amdeed! Course enroll karo. 🚀`}
              </p>
            </motion.div>

            {/* Latest badge */}
            {latestBadge && (
              <motion.div variants={fadeUp}
                className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{latestBadge.emoji}</span>
                <div>
                  <p className="text-xs text-gray-400">Latest Badge</p>
                  <p className="text-sm font-semibold text-gray-900">{latestBadge.label}</p>
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: t('dashboard'), path: '/dashboard', active: true },
            { icon: '📋', label: t('myTasks'), path: '/tasks' },
            { icon: '💬', label: t('chat'), path: '/chat' },
            { icon: '👤', label: t('profile'), path: '/profile' },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
                ${item.active ? 'text-brand-400' : 'text-gray-300 hover:text-gray-500'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
