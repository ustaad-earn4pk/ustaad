import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { chatAPI, supportAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const EMOJI_TO_EXPRESSION = {
  '🤔': 'thinking', '😊': 'welcoming', '🤩': 'excited', '💪': 'encouraging',
  '😤': 'strict', '🎉': 'celebrating', '⌨️': 'typing', '😄': 'welcoming',
  '🥹': 'celebrating', '😴': 'thinking', '😅': 'thinking', '🤗': 'welcoming',
}

function cleanText(text) {
  return (text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/---/g, '')
    .replace(/___/g, '')
}

function MessageBubble({ msg, isBot }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isBot ? 'items-end' : 'items-end justify-end'}`}
    >
      {isBot && (
        <div className="flex-shrink-0 mb-1">
          <UstaadBot expression={EMOJI_TO_EXPRESSION[msg.bot_emoji] || 'welcoming'} size={36} />
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isBot
          ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
          : 'bg-brand-400 text-white rounded-br-md'
      }`}>
        {cleanText(msg.content || msg.message || '').split('\n').map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
      </div>
    </motion.div>
  )
}

function SupportBubble({ msg }) {
  const isAdmin = msg.sender_role !== 'student'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isAdmin ? 'items-end' : 'items-end justify-end'}`}
    >
      {isAdmin && (
        <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
          A
        </div>
      )}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isAdmin
          ? 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
          : 'bg-brand-400 text-white rounded-br-md'
      }`}>
        {msg.message}
        <p className={`text-xs mt-1 ${isAdmin ? 'text-gray-400' : 'text-brand-100'}`}>
          {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <div className="flex-shrink-0 mb-1">
        <UstaadBot expression="typing" size={36} />
      </div>
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-gray-300 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const { user } = useAuthStore()
  const { t, isRTL } = useLangStore()
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('ai')  // 'ai' | 'support'

  // AI Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [remaining, setRemaining] = useState(null)
  const [botExpr, setBotExpr] = useState('welcoming')
  const [langSuggestion, setLangSuggestion] = useState(null)

  // Support Chat state
  const [supportMessages, setSupportMessages] = useState([])
  const [supportInput, setSupportInput] = useState('')
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportUnread, setSupportUnread] = useState(0)
  const [supportPolling, setSupportPolling] = useState(null)

  const language = user?.preferred_language || 'en'

  useEffect(() => {
    loadHistory()
    loadSupportUnread()
  }, [])

  useEffect(() => {
    if (activeTab === 'support') {
      loadSupportMessages()
      // Start polling
      const interval = setInterval(loadSupportMessages, 5000)
      setSupportPolling(interval)
    } else {
      // Stop polling
      if (supportPolling) {
        clearInterval(supportPolling)
        setSupportPolling(null)
      }
    }
    return () => {
      if (supportPolling) clearInterval(supportPolling)
    }
  }, [activeTab])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, supportMessages, loading])

  async function loadHistory() {
    try {
      const res = await chatAPI.getHistory()
      const history = res.data || []
      if (history.length === 0) {
        setMessages([{
          role: 'assistant',
          content: language === 'ur_nastaliq'
            ? 'السلام علیکم! میں USTAAD ہوں۔ آج میں آپ کی کیا مدد کر سکتا ہوں؟ 😊'
            : language === 'ur_roman'
            ? 'Assalam o Alaikum! Main USTAAD hun. Aaj main aapki kya madad kar sakta hun? 😊'
            : 'Assalam o Alaikum! I\'m USTAAD. How can I help you today? 😊',
          bot_emoji: '🤗',
          id: 'welcome'
        }])
      } else {
        setMessages(history)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadSupportMessages() {
    try {
      const res = await supportAPI.getMessages()
      setSupportMessages(res.data || [])
      setSupportUnread(0)
    } catch (err) {
      console.error(err)
    }
  }

  async function loadSupportUnread() {
    try {
      const res = await supportAPI.getUnreadCount()
      setSupportUnread(res.data?.unread || 0)
    } catch (err) {
      console.error(err)
    }
  }

  async function sendSupportMessage() {
    const text = supportInput.trim()
    if (!text || supportLoading) return

    setSupportInput('')
    setSupportLoading(true)

    // Optimistic update
    setSupportMessages(prev => [...prev, {
      sender_role: 'student',
      message: text,
      created_at: new Date().toISOString(),
      id: 'temp-' + Date.now()
    }])

    try {
      await supportAPI.sendMessage({ message: text })
      await loadSupportMessages()
    } catch (err) {
      console.error(err)
    } finally {
      setSupportLoading(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setLoading(true)
    setBotExpr('typing')
    setLangSuggestion(null)

    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await chatAPI.send({ message: text, language })
      const { message, emoji, messages_remaining, language_suggestion } = res.data

      const botMsg = { role: 'assistant', content: message, bot_emoji: emoji, id: Date.now() + 1 }
      setMessages(prev => [...prev, botMsg])
      setBotExpr(EMOJI_TO_EXPRESSION[emoji] || 'welcoming')
      setRemaining(messages_remaining)
      if (language_suggestion) setLangSuggestion(language_suggestion)
      setTimeout(() => setBotExpr('welcoming'), 3000)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.detail || 'Kuch masla hua. Dobara try karein.',
        bot_emoji: '😅',
        id: Date.now() + 1
      }])
      setBotExpr('thinking')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleSupportKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportMessage() }
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-50 ${isRTL() ? 'dir-rtl' : ''}`}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-3 safe-top flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">
            ‹
          </button>
          <div className="flex items-center gap-3 flex-1">
            <UstaadBot expression={botExpr} size={38} />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {activeTab === 'ai' ? 'USTAAD AI' : 'Support'}
              </p>
              <p className="text-xs text-brand-600">
                {activeTab === 'ai'
                  ? (loading ? 'Soch raha hun...' : 'Online')
                  : 'Admin se baat karo'}
              </p>
            </div>
          </div>
          {activeTab === 'ai' && remaining !== null && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Remaining</p>
              <p className={`text-sm font-bold ${remaining <= 5 ? 'text-red-500' : 'text-brand-600'}`}>
                {remaining}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${activeTab === 'ai' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>
            🤖 AI Chat
          </button>
          <button onClick={() => setActiveTab('support')}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all relative ${activeTab === 'support' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}>
            💬 Support
            {supportUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {supportUnread}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* AI Chat */}
      {activeTab === 'ai' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <UstaadBot expression="thinking" size={60} />
                  <p className="text-sm text-gray-400">Chat load ho raha hai...</p>
                </div>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <MessageBubble key={msg.id || i} msg={msg} isBot={msg.role === 'assistant'} />
                  ))}
                </AnimatePresence>
                {loading && <TypingIndicator />}
                {langSuggestion && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-2 rounded-full">
                      💡 {langSuggestion}
                    </div>
                  </motion.div>
                )}
                {remaining !== null && remaining <= 3 && remaining > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                    <div className="bg-red-50 border border-red-100 text-red-500 text-xs px-4 py-2 rounded-full">
                      ⚠️ Sirf {remaining} messages baaki hain aaj ke liye
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom flex-shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-end gap-2">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={language === 'ur_nastaliq' ? 'یہاں لکھیں...' : language === 'ur_roman' ? 'Yahan likhein...' : 'Type your message...'}
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400 max-h-24"
                  style={{ fontFamily: language === 'ur_nastaliq' ? 'Noto Nastaliq Urdu, serif' : 'inherit' }}
                  disabled={loading || remaining === 0} />
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={sendMessage}
                disabled={!input.trim() || loading || remaining === 0}
                className="w-11 h-11 bg-brand-400 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </motion.button>
            </div>
            {messages.length <= 1 && !loading && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {[
                  { label: '📋 Aaj ka task kya hai?', text: 'Aaj ka task kya hai?' },
                  { label: '📊 Mera progress?', text: 'Mera progress kya hai?' },
                  { label: '❓ Help chahiye', text: 'Mujhe help chahiye' },
                ].map((s, i) => (
                  <button key={i} onClick={() => { setInput(s.text); inputRef.current?.focus() }}
                    className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Support Chat */}
      {activeTab === 'support' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {supportMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-3xl">💬</p>
                <p className="text-sm font-semibold text-gray-700">Admin se baat karo</p>
                <p className="text-xs text-gray-400 text-center">Koi bhi masla ho — yahan message karo. Admin jald reply karega.</p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {supportMessages.map((msg, i) => (
                    <SupportBubble key={msg.id || i} msg={msg} />
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="bg-white border-t border-gray-100 px-4 py-3 safe-bottom flex-shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
                <textarea value={supportInput} onChange={e => setSupportInput(e.target.value)}
                  onKeyDown={handleSupportKey}
                  placeholder="Admin ko message karo..."
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400 max-h-24" />
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={sendSupportMessage}
                disabled={!supportInput.trim() || supportLoading}
                className="w-11 h-11 bg-brand-400 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0">
                {supportLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
