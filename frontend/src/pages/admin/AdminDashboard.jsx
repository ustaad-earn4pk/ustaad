\import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminAPI, supportAPI } from '../../api'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'
import NotificationBell from '../../components/NotificationBell'

const stagger = { animate: { transition: { staggerChildren: 0.05 } } }
const fadeUp = { initial: { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 } }

function SettingsTab({ userEmail }) {
  const [tuners, setTuners] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [activeSection, setActiveSection] = useState('tuners')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [passwordModal, setPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(null)
  const [promptDraft, setPromptDraft] = useState('')

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const [tunersRes, promptsRes] = await Promise.all([
        adminAPI.getTuners(),
        adminAPI.getPrompts()
      ])
      setTuners(tunersRes.data)
      setPrompts(promptsRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function saveTuners() {
    setSaving(true)
    try {
      await adminAPI.updateTuners(tuners)
      showToast('Tuners save ho gaye ✅')
    } catch (err) {
      showToast('Save nahi ho saka ❌')
    } finally {
      setSaving(false)
    }
  }

  async function verifyPassword() {
    setVerifying(true)
    try {
      await adminAPI.verifyPassword({ email: userEmail, password })
      setPasswordModal(false)
      setPassword('')
      setShowAdvanced(true)
      showToast('Password verify ho gaya ✅')
    } catch (err) {
      showToast('Password galat hai ❌')
    } finally {
      setVerifying(false)
    }
  }

  async function savePrompt() {
    if (!editingPrompt) return
    setSaving(true)
    try {
      await adminAPI.updatePrompt({
        category: editingPrompt.category,
        key: editingPrompt.key,
        prompt_en: promptDraft,
        prompt_ur: editingPrompt.prompt_ur || '',
        prompt_roman: editingPrompt.prompt_roman || '',
        description: editingPrompt.description || '',
      })
      setEditingPrompt(null)
      setPromptDraft('')
      loadSettings()
      showToast('Prompt save ho gaya ✅')
    } catch (err) {
      showToast('Save nahi ho saka ❌')
    } finally {
      setSaving(false)
    }
  }

  const TUNER_OPTIONS = {
    grading_strictness: {
      label: 'Grading Sakhtagi', icon: '⚖️', desc: 'Tasks grade karne ki strictness',
      options: [
        { value: 'sakht', label: 'Sakht' },
        { value: 'normal', label: 'Normal' },
        { value: 'naram', label: 'Naram' },
      ]
    },
    feedback_length: {
      label: 'Feedback Lambai', icon: '📝', desc: 'AI feedback kitna lamba ho',
      options: [
        { value: 'chota', label: 'Chota' },
        { value: 'normal', label: 'Normal' },
        { value: 'lamba', label: 'Lamba' },
      ]
    },
    encouragement_level: {
      label: 'Hosla Afzai', icon: '💪', desc: 'AI kitna encourage kare',
      options: [
        { value: 'kam', label: 'Kam' },
        { value: 'medium', label: 'Normal' },
        { value: 'zyada', label: 'Zyada' },
      ]
    },
    language_tone: {
      label: 'Zabaan ka Andaaz', icon: '🗣️', desc: 'AI kaise baat kare',
      options: [
        { value: 'formal', label: 'Formal' },
        { value: 'normal', label: 'Normal' },
        { value: 'dost', label: 'Dost Jaisa' },
      ]
    },
  }

  if (loading) return <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
        {['tuners', 'prompts'].map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
              ${activeSection === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
            {s === 'tuners' ? '🎛️ Tuners' : '📋 Prompts'}
          </button>
        ))}
      </div>

      {activeSection === 'tuners' && tuners && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Daily Chat Limit</p>
                <p className="text-xs text-gray-500">Har student rozana kitne messages bhej sake</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 20, 30, 50, 100].map(n => (
                <button key={n} onClick={() => setTuners(p => ({ ...p, chat_daily_limit: n }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all
                    ${tuners.chat_daily_limit == n ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(TUNER_OPTIONS).map(([key, config]) => (
            <div key={key} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{config.label}</p>
                  <p className="text-xs text-gray-500">{config.desc}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {config.options.map(opt => (
                  <button key={opt.value} onClick={() => setTuners(p => ({ ...p, [key]: opt.value }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
                      ${tuners[key] === opt.value ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={saveTuners} disabled={saving}
            className="w-full py-3 rounded-2xl bg-brand-400 text-white font-semibold text-sm disabled:opacity-50">
            {saving ? 'Saving...' : '💾 Tuners Save Karo'}
          </button>
        </div>
      )}

      {activeSection === 'prompts' && (
        <div className="space-y-3">
          {!showAdvanced ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">⚠️ Advanced Access</p>
              <p className="text-xs text-amber-700">Prompts edit karna system behavior directly affect karta hai. Apna password confirm karo.</p>
              <button onClick={() => setPasswordModal(true)}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white text-sm font-medium">
                🔑 Password Confirm Karo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <p className="text-xs text-green-700 font-medium">✅ Advanced edit mode active</p>
              </div>
              {editingPrompt ? (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{editingPrompt.category} / {editingPrompt.key}</p>
                      {editingPrompt.description && <p className="text-xs text-gray-500">{editingPrompt.description}</p>}
                    </div>
                    <button onClick={() => { setEditingPrompt(null); setPromptDraft('') }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs">✕</button>
                  </div>
                  <textarea value={promptDraft} onChange={e => setPromptDraft(e.target.value)} rows={12}
                    className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-brand-400" />
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingPrompt(null); setPromptDraft('') }}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">Cancel</button>
                    <button onClick={savePrompt} disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-brand-400 text-white text-sm font-medium disabled:opacity-50">
                      {saving ? 'Saving...' : '💾 Save'}
                    </button>
                  </div>
                </div>
              ) : prompts.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-400 text-sm">Koi prompt nahi mila</p></div>
              ) : (
                prompts.map((prompt, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{prompt.category} / {prompt.key}</p>
                        {prompt.description && <p className="text-xs text-gray-500 mt-0.5">{prompt.description}</p>}
                        <p className="text-xs text-gray-400 mt-1 font-mono line-clamp-2">{prompt.prompt_en?.slice(0, 80)}...</p>
                      </div>
                      <button onClick={() => { setEditingPrompt(prompt); setPromptDraft(prompt.prompt_en || '') }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-medium">
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {passwordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setPasswordModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
              <h2 className="text-lg font-bold text-gray-900">Password Confirm Karo</h2>
              <p className="text-xs text-gray-500">Prompts edit karne ke liye apna super admin password enter karo</p>
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyPassword()}
                className="input w-full" />
              <div className="flex gap-2">
                <button onClick={() => { setPasswordModal(false); setPassword('') }}
                  className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm">Cancel</button>
                <button onClick={verifyPassword} disabled={verifying || !password}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-medium text-sm disabled:opacity-50">
                  {verifying ? '...' : 'Verify'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PaymentsTab() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => { loadPayments() }, [])

  async function loadPayments() {
    try {
      const res = await adminAPI.getPendingPayments()
      setPayments(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(paymentId, action) {
    setReviewing(paymentId)
    try {
      await adminAPI.reviewPayment(paymentId, { action, admin_note: note || null })
      setNote('')
      loadPayments()
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed.')
    } finally {
      setReviewing(null)
    }
  }

  if (loading) return <div className="skeleton h-32" />
  if (payments.length === 0) return (
    <div className="card text-center py-8">
      <p className="text-2xl mb-2">✅</p>
      <p className="text-gray-500 text-sm">Koi pending payment nahi</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {payments.map(p => (
        <div key={p.id} className="card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{p.student_id}</p>
              <p className="text-xs text-gray-500">
                PKR {p.amount_pkr} • {p.gateway}
                {p.payment_type && p.payment_type !== 'new_enrollment' && (
                  <span className="ml-2 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {p.payment_type === 'renewal_same' ? '🔄 Renewal' : '⬆️ Next Course'}
                  </span>
                )}
              </p>
            </div>
            <span className="badge bg-amber-50 text-amber-700">pending</span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-gray-900">{p.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Sender</span>
              <span className="text-gray-900">{p.sender_number || '—'}</span>
            </div>
          </div>
          {p.screenshot_url && (
            <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer">
              <img src={p.screenshot_url} alt="screenshot" className="w-full rounded-2xl border border-gray-100 max-h-48 object-contain" />
            </a>
          )}
          <input type="text" placeholder="Note (optional)" value={note}
            onChange={e => setNote(e.target.value)} className="input w-full text-sm" />
          <div className="flex gap-2">
            <button disabled={reviewing === p.id} onClick={() => handleReview(p.id, 'approve')}
              className="flex-1 btn-primary py-2 text-sm disabled:opacity-50">✓ Approve</button>
            <button disabled={reviewing === p.id} onClick={() => handleReview(p.id, 'reject')}
              className="flex-1 py-2 text-sm rounded-2xl bg-red-50 text-red-600 font-medium disabled:opacity-50">✕ Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function SupportTab({ userRole }) {
  const [conversations, setConversations] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [messages, setMessages] = useState([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.student_id)
      const interval = setInterval(() => loadMessages(selectedStudent.student_id), 5000)
      setPolling(interval)
    }
    return () => { if (polling) clearInterval(polling) }
  }, [selectedStudent])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConversations() {
    try {
      const res = await supportAPI.getConversations()
      setConversations(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadMessages(studentId) {
    try {
      const res = await supportAPI.getStudentMessages(studentId)
      setMessages(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedStudent) return
    setSending(true)
    try {
      await supportAPI.replyToStudent(selectedStudent.student_id, { message: replyText.trim() })
      setReplyText('')
      await loadMessages(selectedStudent.student_id)
      await loadConversations()
    } catch (err) {
      alert(err.response?.data?.detail || 'Reply fail ho gaya')
    } finally {
      setSending(false)
    }
  }

  if (selectedStudent) {
    return (
      <div className="flex flex-col h-[70vh]">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setSelectedStudent(null)} className="text-brand-600 font-medium text-sm">← Back</button>
          <div>
            <p className="font-semibold text-gray-900">{selectedStudent.student_name}</p>
            <p className="text-xs text-gray-500">{selectedStudent.student_email}</p>
          </div>
          {selectedStudent.is_owned_by_other && (
            <span className="ml-auto text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full">🔒 Kisi aur admin ke paas</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.map((msg, i) => {
            const isAdmin = msg.sender_role !== 'student'
            return (
              <div key={msg.id || i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm ${isAdmin ? 'bg-brand-400 text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'}`}>
                  {msg.message}
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-brand-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
            placeholder="Reply karo..." className="input flex-1 text-sm"
            disabled={selectedStudent.is_owned_by_other} />
          <button onClick={handleReply} disabled={sending || !replyText.trim() || selectedStudent.is_owned_by_other}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <div className="skeleton h-32" />
  if (conversations.length === 0) return (
    <div className="card text-center py-8">
      <p className="text-2xl mb-2">💬</p>
      <p className="text-gray-500 text-sm">Koi support message nahi abhi</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {conversations.map((conv) => (
        <button key={conv.student_id} onClick={() => setSelectedStudent(conv)}
          className="w-full text-left card flex items-center gap-3 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center font-bold text-brand-600 flex-shrink-0">
            {conv.student_name?.[0] || 'S'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 text-sm">{conv.student_name}</p>
              {conv.unread_count > 0 && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{conv.unread_count}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{conv.last_message?.message || 'No messages yet'}</p>
            {conv.is_owned_by_other && <p className="text-xs text-orange-500 mt-0.5">🔒 Kisi aur admin ke paas</p>}
            {conv.is_owned_by_me && <p className="text-xs text-brand-500 mt-0.5">✓ Aapka session</p>}
          </div>
        </button>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [statsRes, studentsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getStudents()
      ])
      setStats(statsRes.data)
      setStudents(studentsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const approveStudent = async (studentId) => {
    try {
      await adminAPI.approveStudent({ student_id: studentId, trial_days: 7 })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const statusColor = {
    pending: 'bg-amber-50 text-amber-700',
    trial: 'bg-blue-50 text-blue-700',
    active: 'bg-brand-50 text-brand-700',
    suspended: 'bg-red-50 text-red-700',
    expired: 'bg-gray-100 text-gray-600',
  }

  const userRole = user?.role
  const isSuperAdmin = userRole === 'super_admin'

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'students', label: '👥 Students' },
    { key: 'payments', label: '💰 Payments' },
    { key: 'support', label: '💬 Support' },
    ...(isSuperAdmin ? [{ key: 'settings', label: '⚙️ Settings' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {isSuperAdmin ? 'Super Admin' : 'Admin'} Panel
            </p>
            <h1 className="text-xl font-bold text-gray-900">USTAAD 🎓</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <NotificationBell />
            {isSuperAdmin && (
              <button onClick={() => navigate('/admin/management')}
                className="text-xs font-medium px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                👤 Admins
              </button>
            )}
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100">
              Logout
            </button>
          </div>
        </div>

        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex-1 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap
                ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div variants={stagger} initial="initial" animate="animate" className="px-5 pt-5 space-y-4">

        {activeTab === 'overview' && (
          <>
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
              {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-20" />) : (
                [
                  { label: 'Total Students', value: stats?.total || 0, icon: '👥', color: 'bg-blue-50' },
                  { label: 'Pending', value: stats?.pending || 0, icon: '⏳', color: 'bg-amber-50' },
                  { label: 'Active', value: stats?.active || 0, icon: '✅', color: 'bg-brand-50' },
                  { label: 'Trial', value: stats?.trial || 0, icon: '🎯', color: 'bg-purple-50' },
                ].map((s, i) => (
                  <motion.div key={i} variants={fadeUp} className={`card ${s.color}`}>
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-600">{s.label}</p>
                  </motion.div>
                ))
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="card">
              <p className="text-sm font-semibold text-gray-700 mb-1">💰 Monthly AI Cost</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.monthly_cost_usd?.toFixed(4) || '0.0000'}</p>
              <p className="text-xs text-gray-500 mt-1">USD this month</p>
            </motion.div>

            {students.filter(s => s.status === 'pending').length > 0 && (
              <motion.div variants={fadeUp}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">⏳ Pending Approvals</p>
                <div className="space-y-2">
                  {students.filter(s => s.status === 'pending').map((student) => (
                    <div key={student.id} className="card flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center font-bold text-brand-600">
                        {student.full_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      </div>
                      <button onClick={() => approveStudent(student.id)} className="btn-primary py-2 px-4 text-sm">Approve</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'students' && (
          <motion.div variants={fadeUp} className="space-y-2">
            {loading ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16" />) :
              students.length === 0 ? (
                <div className="card text-center py-8"><p className="text-gray-400 text-sm">No students yet</p></div>
              ) : (
                students.map((student) => (
                  <motion.div key={student.id} variants={fadeUp}
                    className="card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/admin/student/${student.id}`)}>
                    <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center font-bold text-brand-600">
                      {student.full_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{student.city || student.email}</p>
                    </div>
                    <span className={`badge ${statusColor[student.status] || 'bg-gray-100 text-gray-600'}`}>{student.status}</span>
                  </motion.div>
                ))
              )}
          </motion.div>
        )}

        {activeTab === 'payments' && <motion.div variants={fadeUp}><PaymentsTab /></motion.div>}
        {activeTab === 'support' && <motion.div variants={fadeUp}><SupportTab userRole={userRole} /></motion.div>}
        {activeTab === 'settings' && isSuperAdmin && <motion.div variants={fadeUp}><SettingsTab userEmail={user?.email} /></motion.div>}

      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: 'Dashboard', path: '/admin' },
            { icon: '👥', label: 'Students', path: '/admin/students' },
            { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1 text-gray-400 hover:text-brand-600 transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
