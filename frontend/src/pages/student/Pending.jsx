import { motion } from 'framer-motion'
import { useLangStore } from '../../store/langStore'
import { useAuthStore } from '../../store/authStore'
import UstaadBot from '../../components/bot/UstaadBot'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

export default function Pending() {
  const { t } = useLangStore()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">

      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <UstaadBot expression="thinking" size={120} />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-xs"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {user?.full_name?.split(' ')[0]} bhai! 👋
          </h1>

          <div className="card mb-6">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">{t('pending')}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t('pendingMsg')}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {[
              { icon: '✅', text: 'Account bana liya', done: true },
              { icon: '⏳', text: 'Admin review kar raha hai', done: false },
              { icon: '🚀', text: 'Seekhna shuru karein', done: false },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm
                  ${step.done ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-500'}`}
              >
                <span>{step.icon}</span>
                <span className="font-medium">{step.text}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('logout')}
          </button>
        </motion.div>
      </div>
    </div>
  )
}
