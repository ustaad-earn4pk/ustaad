import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminAPI } from '../../api'

const fadeUp = { initial: { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 } }

const TRACK_NAMES = {
  computer_basics: 'Computer & Internet Basics',
  web_fundamentals: 'Web & Business Basics',
  ghl_developer: 'GoHighLevel Developer',
  integration_expert: 'Integration Expert',
  full_stack_automation: 'Full Stack Automation',
  client_hunting: 'Client Hunting & Portfolio',
}

const TRACK_OPTIONS = Object.entries(TRACK_NAMES)

const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇬🇧 English' },
  { value: 'ur_roman', label: '🇵🇰 Roman Urdu' },
  { value: 'ur_nastaliq', label: '🇵🇰 اردو' },
]

const STATUS_COLOR = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  trial: 'bg-blue-50 text-blue-700',
  suspended: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-xs font-medium rounded-xl transition-all flex-shrink-0
        ${active ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
      {children}
    </button>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value || '—'}</span>
    </div>
  )
}

export default function AdminStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.role === 'super_admin'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState([])

  // Edit state (super admin only)
  const [editLanguage, setEditLanguage] = useState('')
  const [editTrack, setEditTrack] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editAdminId, setEditAdminId] = useState('')

  useEffect(() => {
    loadDetail()
    if (isSuperAdmin) loadAdmins()
  }, [id])

  async function loadDetail() {
    try {
      const res = await adminAPI.getStudentFullDetail(id)
      setData(res.data)
      setEditLanguage(res.data.user?.preferred_language || 'en')
      setEditTrack(res.data.profile?.current_track || '')
      setEditStatus(res.data.profile?.status || '')
      setEditAdminId(res.data.assigned_admin?.admin_id || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAdmins() {
    try {
      const res = await adminAPI.getAdminsList()
      setAdmins(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      await adminAPI.updateStudentSettings(id, {
        preferred_language: editLanguage,
        current_track: editTrack,
        status: editStatus,
        assigned_admin_id: editAdminId,
      })
      await loadDetail()
      alert('Settings saved!')
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400 text-sm">Student not found</div>
    </div>
  )

  const { user: studentUser, profile, course, tasks, submissions, payments, support_messages, ai_messages, assigned_admin } = data

  const tabs = [
    { key: 'info', label: '👤 Info' },
    { key: 'tasks', label: '📋 Tasks' },
    { key: 'payments', label: '💰 Payments' },
    { key: 'support', label: '💬 Support' },
    ...(isSuperAdmin ? [
      { key: 'ai_chat', label: '🤖 AI Chat' },
      { key: 'settings', label: '⚙️ Settings' },
    ] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 text-xl">
            ‹
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{studentUser?.full_name}</h1>
            <p className="text-xs text-gray-500">{studentUser?.email}</p>
          </div>
          <span className={`badge text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLOR[profile?.status] || 'bg-gray-100 text-gray-600'}`}>
            {profile?.status}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-2xl overflow-x-auto">
          {tabs.map(tab => (
            <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </TabButton>
          ))}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* ── INFO TAB ── */}
        {activeTab === 'info' && (
          <motion.div {...fadeUp} className="space-y-4">

            {/* Basic Info */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Basic Info</p>
              <InfoRow label="Phone" value={studentUser?.phone} />
              <InfoRow label="City" value={studentUser?.city} />
              <InfoRow label="Age" value={studentUser?.age} />
              <InfoRow label="Gender" value={studentUser?.gender} />
              <InfoRow label="Language" value={LANGUAGE_OPTIONS.find(l => l.value === studentUser?.preferred_language)?.label} />
            </div>

            {/* Course Info */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Course</p>
              <InfoRow label="Current Track" value={TRACK_NAMES[profile?.current_track] || profile?.current_track} />
              <InfoRow label="Status" value={profile?.status} />
              <InfoRow label="Plan Started" value={profile?.plan_started_at ? new Date(profile.plan_started_at).toLocaleDateString() : null} />
              <InfoRow label="Plan Ends" value={profile?.plan_ends_at ? new Date(profile.plan_ends_at).toLocaleDateString() : null} />
              <InfoRow label="Tasks Assigned" value={profile?.total_tasks_assigned} />
              <InfoRow label="Tasks Completed" value={profile?.total_tasks_completed} />
              <InfoRow label="Average Score" value={profile?.average_score ? `${profile.average_score}%` : null} />
              <InfoRow label="Total Points" value={profile?.total_points} />
            </div>

            {/* Streak + Badges */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Streak & Badges</p>
              <InfoRow label="Current Streak" value={`${profile?.current_streak || 0} days`} />
              <InfoRow label="Longest Streak" value={`${profile?.longest_streak || 0} days`} />
              <InfoRow label="Last Activity" value={profile?.last_activity_date ? new Date(profile.last_activity_date).toLocaleDateString() : null} />
              {(profile?.streak_badges || []).length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {profile.streak_badges.map((badge, i) => (
                    <span key={i} className="bg-brand-50 text-brand-700 text-xs px-3 py-1 rounded-full">
                      {badge.emoji} {badge.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Admin */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assigned Admin</p>
              {assigned_admin ? (
                <>
                  <InfoRow label="Name" value={assigned_admin.users?.full_name} />
                  <InfoRow label="Email" value={assigned_admin.users?.email} />
                  <InfoRow label="Assigned At" value={new Date(assigned_admin.assigned_at).toLocaleDateString()} />
                </>
              ) : (
                <p className="text-xs text-gray-400">Koi admin assign nahi</p>
              )}
            </div>

          </motion.div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <motion.div {...fadeUp} className="space-y-3">
            {tasks.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">Koi task nahi abhi</p>
              </div>
            ) : tasks.map((task, i) => {
              const submission = submissions.find(s => s.task_id === task.id)
              return (
                <div key={task.id || i} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'graded' ? 'bg-green-50 text-green-700' :
                      task.status === 'submitted' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Day {task.task_number}</span>
                    <span>{task.scheduled_for ? new Date(task.scheduled_for).toLocaleDateString() : ''}</span>
                    {task.ai_score !== null && <span className="font-semibold text-brand-600">Score: {task.ai_score}/100</span>}
                  </div>
                  {task.ai_feedback_en && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                      {task.ai_feedback_en}
                    </p>
                  )}
                  {submission?.file_url && (
                    <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                      <img src={submission.file_url} alt="submission" className="w-full rounded-xl border border-gray-100 max-h-40 object-contain" />
                    </a>
                  )}
                  {submission?.text_content && (
                    <p className="text-xs text-gray-600 bg-blue-50 rounded-xl p-3">
                      📝 {submission.text_content}
                    </p>
                  )}
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <motion.div {...fadeUp} className="space-y-3">
            {payments.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">Koi payment nahi</p>
              </div>
            ) : payments.map((p, i) => (
              <div key={p.id || i} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">PKR {p.amount_pkr?.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    p.status === 'approved' ? 'bg-green-50 text-green-700' :
                    p.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <InfoRow label="Type" value={p.payment_type} />
                <InfoRow label="TxID" value={p.transaction_id} />
                <InfoRow label="Date" value={new Date(p.created_at).toLocaleDateString()} />
                {p.notes && <InfoRow label="Note" value={p.notes} />}
                {p.screenshot_url && (
                  <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img src={p.screenshot_url} alt="payment" className="w-full rounded-xl border border-gray-100 max-h-40 object-contain mt-2" />
                  </a>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── SUPPORT TAB ── */}
        {activeTab === 'support' && (
          <motion.div {...fadeUp}>
            <div className="card space-y-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {support_messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Koi support message nahi</p>
              ) : support_messages.map((msg, i) => {
                const isAdmin = msg.sender_role !== 'student'
                return (
                  <div key={msg.id || i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      isAdmin ? 'bg-brand-400 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      <p className={`text-xs mb-1 font-medium ${isAdmin ? 'text-brand-100' : 'text-gray-400'}`}>
                        {msg.sender_role}
                      </p>
                      {msg.message}
                      <p className={`text-xs mt-1 ${isAdmin ? 'text-brand-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── AI CHAT TAB (super admin only) ── */}
        {activeTab === 'ai_chat' && isSuperAdmin && (
          <motion.div {...fadeUp}>
            <div className="card space-y-3" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {!ai_messages || ai_messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Koi AI chat history nahi</p>
              ) : ai_messages.map((msg, i) => {
                const isBot = msg.role === 'assistant'
                return (
                  <div key={msg.id || i} className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                      isBot ? 'bg-gray-100 text-gray-800 rounded-bl-md' : 'bg-brand-400 text-white rounded-br-md'
                    }`}>
                      <p className={`text-xs mb-1 font-medium ${isBot ? 'text-gray-400' : 'text-brand-100'}`}>
                        {isBot ? '🤖 USTAAD' : '👤 Student'}
                      </p>
                      {msg.content || msg.message}
                      <p className={`text-xs mt-1 ${isBot ? 'text-gray-400' : 'text-brand-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── SETTINGS TAB (super admin only) ── */}
        {activeTab === 'settings' && isSuperAdmin && (
          <motion.div {...fadeUp} className="space-y-4">

            {/* Language */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Language</p>
              <select value={editLanguage} onChange={e => setEditLanguage(e.target.value)}
                className="input w-full text-sm">
                {LANGUAGE_OPTIONS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* Course Track */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Course Track</p>
              <select value={editTrack} onChange={e => setEditTrack(e.target.value)}
                className="input w-full text-sm">
                <option value="">Select track</option>
                {TRACK_OPTIONS.map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Status</p>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="input w-full text-sm">
                <option value="approved">✅ Approved</option>
                <option value="trial">🎯 Trial</option>
                <option value="pending">⏳ Pending</option>
                <option value="suspended">🚫 Suspended</option>
                <option value="expired">⌛ Expired</option>
              </select>
            </div>

            {/* Assigned Admin */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Assigned Admin</p>
              <select value={editAdminId} onChange={e => setEditAdminId(e.target.value)}
                className="input w-full text-sm">
                <option value="">Unassigned</option>
                {admins.filter(a => a.role === 'admin').map(a => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Save Button */}
            <button onClick={handleSaveSettings} disabled={saving}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>

            {/* Danger Zone */}
            <div className="card border border-red-100">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">Danger Zone</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditStatus('suspended')
                    handleSaveSettings()
                  }}
                  className="flex-1 py-2 text-sm rounded-2xl bg-red-50 text-red-600 font-medium">
                  🚫 Suspend Student
                </button>
                <button
                  onClick={() => {
                    setEditStatus('approved')
                    handleSaveSettings()
                  }}
                  className="flex-1 py-2 text-sm rounded-2xl bg-green-50 text-green-700 font-medium">
                  ✅ Activate Student
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  )
}
