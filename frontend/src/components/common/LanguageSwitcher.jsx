import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLangStore } from '../../store/langStore'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ur_nastaliq', label: 'اردو', flag: '🇵🇰' },
  { code: 'ur_roman', label: 'Roman', flag: '🇵🇰' },
]

export default function LanguageSwitcher({ compact = false }) {
  const [open, setOpen] = useState(false)
  const { language, setLanguage } = useLangStore()

  const current = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
      >
        <span>{current.flag}</span>
        {!compact && <span>{current.label}</span>}
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 min-w-[140px]"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition-colors text-left
                    ${language === lang.code ? 'bg-brand-50 text-brand-600 font-medium' : 'text-gray-700'}`}
                >
                  <span>{lang.flag}</span>
                  <span className={lang.code === 'ur_nastaliq' ? 'font-urdu' : ''}>{lang.label}</span>
                  {language === lang.code && <span className="ml-auto text-brand-400">✓</span>}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
