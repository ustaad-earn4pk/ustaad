import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { onboardingAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

export default function Onboarding() {
  const { user } = useAuthStore()
  const { language, isRTL } = useLangStore()
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [turnsRemaining, setTurnsRemaining] = useState(15)
  const [botExpr, setBotExpr] = useState('welcoming')
  const [initLoading, setInitLoading] = useState(false)
  const lang = user?.preferred_language || language || 'en'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const startOnboarding = async () => {
    setLoading(true)
    setBotExpr('welcoming')
    try {
      const res = await onboardingAPI.start()
      const { message, emoji } = res.data
      setMessages([{ role: 'assistant', content: message, emoji }])
      setStarted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setBotExpr('thinking')
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    try {
      const res = await onboardingAPI.sendMessage({ message: text, language: lang })
      const { message, emoji, is_complete, turns_remaining } = res.data
      const displayMsg = message.replace(/<profile>[\s\S]*?<\/profile>/g, '').trim()
      const botMsg = { role: 'assistant', content: displayMsg, emoji, id: Date.now() + 1 }
      setMessages(prev => [...prev, botMsg])
      if (turns_remaining !== undefined) setTurnsRemaining(turns_remaining)
      if (is_complete) { setIsComplete(true); setBotExpr('celebrating') }
      else { setBotExpr('encouraging'); setTimeout(() => setBotExpr('welcoming'), 2500) }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Kuch masla hua. Dobara try karein.', emoji: '😅', id: Date.now() + 1 }])
    } finally {
      setLoading(false)
      if (!isComplete) inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const progress = Math.round(((15 - turnsRemaining) / 15) * 100)
  const name = user?.full_name?.split(' ')[0] || 'Student'

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
        <div className="flex justify-start p-5 pt-14">
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white text-gray-500">‹</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <UstaadBot expression="welcoming" size={110} />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">Pehli Baat! 🎓</h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">Main {name} bhai se thodi baat karna chahta hun — sirf 10-15 minutes.</p>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mt-8 w-full max-w-xs">
            <motion.button whileTap={{ scale: 0.96 }} onClick={startOnboarding} className="btn-primary w-full py-4 text-base font-semibold">
              {loading ? 'Shuru ho raha hai...' : 'Shuru Karein 🚀'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-3 safe-top flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">‹</button>
          <div className="flex items-center gap-3 flex-1">
            <UstaadBot expression={botExpr} size={38} />
            <div><p className="font-semibold text-gray-900 text-sm">Onboarding</p><p className="text-xs text-gray-400">Pehli Mulaqat</p></div>
          </div>
          {!isComplete && <div className="text-right"><p className="text-xs text-gray-400">Progress</p><p className="text-sm font-bold text-brand-600">{progress}%</p></div>}
        </div>
        {!isComplete && <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden"><motion.div className="h-full bg-brand-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} /></div>}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${msg.role === 'assistant' ? 'items-end' : 'items-end justify-end'}`}>
              {msg.role === 'assistant' && <div className="flex-shrink-0 mb-1"><UstaadBot expression={msg.emoji === '🎉' ? 'celebrating' : 'welcoming'} size={36} /></div>}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm' : 'bg-brand-400 text-white rounded-br-md'}`}>{msg.content}</div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && <div className="flex gap-3 items-end"><div className="flex-shrink-0 mb-1"><UstaadBot expression="thinking" size={36} /></div><div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md"><div className="flex gap-1 items-center h-4">{[0,1,2].map(i => <motion.div key={i} className="w-2 h-2 bg-gray-300 rounded-full" animate={{ y: [0,-5,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />)}</div></div></div>}
        {isComplete && <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="card bg-brand-50 border border-brand-100 text-center py-6 mx-2"><UstaadBot expression="celebrating" size={70} /><h2 className="text-lg font-bold text-gray-900 mt-4">Onboarding Mukammal! 🎉</h2><p className="text-sm text-gray-500 mt-2">USTAAD ne aapka profile tayyar kar liya!</p><motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate('/dashboard')} className="btn-primary w-full mt-5">Dashboard pe Jao 🏠</motion.button></motion.div>}
        <div ref={bottomRef} />
      </div>
      {!isComplete && (
        <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom flex-shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Jawab dein..." rows={1} className="w-full bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400 max-h-24" disabled={loading} />
            </div>
            <motion.button whileTap={{ scale: 0.92 }} onClick={sendMessage} disabled={!input.trim() || loading} className="w-11 h-11 bg-brand-400 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0">
              {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}