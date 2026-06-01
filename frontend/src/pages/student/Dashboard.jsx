import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } }
}
const fadeUp = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1 }
}

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const { t } = useLangStore()
  const navigate = useNavigate()

  const name = user?.full_name?.split(' ')[0] || 'Student'

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
            <button
              onClick={logout}
              className="w-10 h-10 bg-brand-400 rounded-2xl flex items-center justify-center text-white font-bold"
              title="Logout"
            >
              {name[0]}
            </button>
          </div>
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="px-5 pt-5 space-y-4"
      >

        {/* Streak + Progress */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-gray-500">{t('streak')}</p>
                <p className="text-lg font-bold text-gray-900">0 days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{t('level')}</p>
              <p className="text-lg font-bold text-brand-600">Level 1</p>
            </div>
          </div>
          <div className="score-bar">
            <motion.div
              className="score-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: '0%' }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">0% complete</p>
        </motion.div>

        {/* Today's Task */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {t('todayTask')}
          </p>
          <div className="card-hover" onClick={() => navigate('/onboarding')}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-brand-50 text-brand-700">New</span>
                </div>
                <h3 className="font-semibold text-gray-900">USTAAD se milein!</h3>
                <p className="text-sm text-gray-500 mt-0.5">Onboarding shuru karein</p>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </div>
          </div>
        </motion.div>

        {/* Bot greeting */}
        <motion.div variants={fadeUp} className="card">
          <div className="flex items-start gap-3">
            <UstaadBot expression="welcoming" size={50} />
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                "{name} bhai, USTAAD mein aapka bohat bohat khairmaqdid hai!
                Pehle thodi baat karte hain — onboarding shuru karein 🎓"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <motion.div variants={fadeUp}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Overview
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tasks', value: '0', icon: '📋' },
              { label: t('points'), value: '0', icon: '⭐' },
              { label: 'Score', value: '-', icon: '📊' },
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
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
                ${item.active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
