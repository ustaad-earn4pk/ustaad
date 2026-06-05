import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminManagementAPI } from '../../api'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import NotificationBell from '../../components/NotificationBell'

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = { initial: { y: 14, opacity: 0 }, animate: { y: 0, opacity: 1 } }

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// ── Add Admin Modal ────────────────────────────────────────────────────────────
function AddAdminModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Naam aur email dono zaroori hain')
      return
    }
    setLoading(true)
    setError('')
    try {
      await adminManagementAPI.createAdmin(form)
      onSuccess('Admin bana diya gaya. Password reset link email pe bhej diya gaya. ✅')
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Admin create nahi ho saka')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Naya Admin Add Karo</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Poora Naam</label>
            <input type="text" placeholder="Muhammad Ali" value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <input type="email" placeholder="admin@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input w-full" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <p className="text-xs text-gray-400">Admin ko email pe password set karne ka link jayega.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-medium text-sm disabled:opacity-50">
            {loading ? '...' : 'Admin Banao'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Edit Admin Modal ───────────────────────────────────────────────────────────
function EditAdminModal({ admin, onClose, onSuccess }) {
  const [fullName, setFullName] = useState(admin.full_name || '')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')

  async function handleUpdate() {
    if (!fullName.trim()) return
    setLoading(true)
    setError('')
    try {
      await adminManagementAPI.updateAdmin(admin.id, { full_name: fullName })
      onSuccess('Admin update ho gaya ✅')
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Update nahi ho saka')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setResetting(true)
    try {
      await adminManagementAPI.resetPassword(admin.id)
      onSuccess(`Password reset link ${admin.email} pe bhej diya gaya ✅`)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset link nahi bheja ja saka')
    } finally {
      setResetting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Admin Edit Karo</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Naam</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <input type="email" value={admin.email} disabled className="input w-full opacity-50 cursor-not-allowed" />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
        </div>
        <button onClick={handleResetPassword} disabled={resetting}
          className="w-full py-3 rounded-2xl border-2 border-amber-200 bg-amber-50 text-amber-700 font-medium text-sm disabled:opacity-50">
          {resetting ? '...' : '🔑 Password Reset Link Bhejo'}
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium text-sm">Cancel</button>
          <button onClick={handleUpdate} disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white font-medium text-sm disabled:opacity-50">
            {loading ? '...' : 'Save Karo'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Performance Modal ──────────────────────────────────────────────────────────
function PerformanceModal({ admin, onClose }) {
  const [period, setPeriod] = useState('weekly')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPerformance() }, [period])

  async function loadPerformance() {
    setLoading(true)
    try {
      const res = await adminManagementAPI.getPerformance(admin.id, { period })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const pieData = data ? [
    { name: 'Engaged', value: data.kpis.total_students_engaged },
    { name: 'Not Engaged', value: Math.max(0, data.kpis.assigned_students_total - data.kpis.total_students_engaged) },
  ] : []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center p-0"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        className="bg-white rounded-t-3xl w-full max-w-lg h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900">📊 Performance</h2>
            <p className="text-xs text-gray-500">{admin.full_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">✕</button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
          {['daily', 'weekly', 'monthly'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all
                ${period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {p === 'daily' ? 'Aaj' : p === 'weekly' ? 'Hafte' : 'Mahina'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Students Engaged', value: data.kpis.total_students_engaged, icon: '👥', color: 'bg-indigo-50' },
                { label: 'Messages Sent', value: data.kpis.total_messages_sent, icon: '💬', color: 'bg-green-50' },
                { label: 'Avg Response', value: data.kpis.avg_response_time_minutes != null ? `${data.kpis.avg_response_time_minutes} min` : 'N/A', icon: '⚡', color: 'bg-amber-50' },
                { label: 'Response Rate', value: `${data.kpis.response_rate_pct}%`, icon: '✅', color: 'bg-blue-50' },
              ].map((k, i) => (
                <div key={i} className={`${k.color} rounded-2xl p-3`}>
                  <p className="text-xl mb-1">{k.icon}</p>
                  <p className="text-xl font-bold text-gray-900">{k.value}</p>
                  <p className="text-xs text-gray-600">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Pie Chart — Engagement */}
            {pieData[0]?.value > 0 || pieData[1]?.value > 0 ? (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Student Engagement</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            {/* Bar Chart — Daily Messages */}
            {data.daily_chart?.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Daily Messages</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.daily_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.daily_chart?.length === 0 && data.kpis.total_messages_sent === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">Is period mein koi activity nahi</div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">Data load nahi ho saka</div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminManagement() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('admins')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editAdmin, setEditAdmin] = useState(null)
  const [perfAdmin, setPerfAdmin] = useState(null)
  const [toast, setToast] = useState('')
  const [allPerf, setAllPerf] = useState(null)
  const [allPerfPeriod, setAllPerfPeriod] = useState('weekly')
  const [allPerfLoading, setAllPerfLoading] = useState(false)

  useEffect(() => { loadAdmins() }, [])
  useEffect(() => { if (activeTab === 'performance') loadAllPerf() }, [activeTab, allPerfPeriod])

  async function loadAdmins() {
    setLoading(true)
    try {
      const res = await adminManagementAPI.listAdmins()
      setAdmins(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadAllPerf() {
    setAllPerfLoading(true)
    try {
      const res = await adminManagementAPI.getAllPerformance({ period: allPerfPeriod })
      setAllPerf(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setAllPerfLoading(false)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const allPerfChartData = allPerf?.admins?.map(a => ({
    name: a.full_name?.split(' ')[0] || 'Admin',
    engaged: a.students_engaged,
    messages: a.messages_sent,
    rate: a.engagement_rate_pct,
  })) || []

  const pieAllData = allPerf?.admins?.map(a => ({
    name: a.full_name?.split(' ')[0] || 'Admin',
    value: a.students_engaged,
  })).filter(a => a.value > 0) || []

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')}
              className="w-9 h-9 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200">
              ←
            </button>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Super Admin</p>
              <h1 className="text-xl font-bold text-gray-900">Admin Management</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-2xl">
          {['admins', 'performance'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all
                ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
              {tab === 'admins' ? '👤 Admins' : '📊 Performance'}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-3 rounded-2xl shadow-xl max-w-xs text-center">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="initial" animate="animate" className="px-5 pt-5 space-y-4">

        {/* ── Admins Tab ── */}
        {activeTab === 'admins' && (
          <>
            <motion.div variants={fadeUp}>
              <button onClick={() => setShowAddModal(true)}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm">
                <span className="text-lg">+</span> Naya Admin Add Karo
              </button>
            </motion.div>

            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : admins.length === 0 ? (
              <motion.div variants={fadeUp} className="card text-center py-10">
                <p className="text-3xl mb-2">👤</p>
                <p className="text-gray-500 text-sm">Koi admin nahi abhi</p>
              </motion.div>
            ) : (
              admins.map((admin) => (
                <motion.div key={admin.id} variants={fadeUp}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center font-bold text-indigo-600 text-lg flex-shrink-0">
                      {admin.full_name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{admin.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      admin.role === 'super_admin' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {admin.role === 'super_admin' ? '⭐ Super' : 'Admin'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                    <span>👥 Assigned Students</span>
                    <span className="font-semibold text-gray-900">{admin.assigned_students_count}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setPerfAdmin(admin)}
                      className="flex-1 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors">
                      📊 Performance
                    </button>
                    {admin.role !== 'super_admin' && (
                      <button onClick={() => setEditAdmin(admin)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </>
        )}

        {/* ── Performance Tab ── */}
        {activeTab === 'performance' && (
          <>
            {/* Period Filter */}
            <motion.div variants={fadeUp} className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
              {['daily', 'weekly', 'monthly'].map(p => (
                <button key={p} onClick={() => setAllPerfPeriod(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all
                    ${allPerfPeriod === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}>
                  {p === 'daily' ? 'Aaj' : p === 'weekly' ? 'Hafte' : 'Mahina'}
                </button>
              ))}
            </motion.div>

            {allPerfLoading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            ) : allPerf ? (
              <>
                {/* Consolidated KPI Table */}
                <motion.div variants={fadeUp} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Sab Admins — Overview</p>
                  {allPerf.admins.map((a, i) => (
                    <div key={a.admin_id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: COLORS[i % COLORS.length] + '20', color: COLORS[i % COLORS.length] }}>
                        {a.full_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.full_name}</p>
                        <p className="text-xs text-gray-500">{a.students_engaged} engaged / {a.assigned_students} assigned</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{a.engagement_rate_pct}%</p>
                        <p className="text-xs text-gray-400">{a.messages_sent} msgs</p>
                      </div>
                    </div>
                  ))}
                  {allPerf.admins.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">Is period mein koi data nahi</p>
                  )}
                </motion.div>

                {/* Pie Chart — Who engaged most */}
                {pieAllData.length > 0 && (
                  <motion.div variants={fadeUp} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Student Engagement Distribution</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieAllData} cx="50%" cy="50%" outerRadius={75}
                          paddingAngle={3} dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}>
                          {pieAllData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Bar Chart — Messages comparison */}
                {allPerfChartData.length > 0 && (
                  <motion.div variants={fadeUp} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Messages Sent Comparison</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={allPerfChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="messages" fill="#6366f1" radius={[6, 6, 0, 0]} name="Messages" />
                        <Bar dataKey="engaged" fill="#22c55e" radius={[6, 6, 0, 0]} name="Engaged" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">Data load nahi ho saka</div>
            )}
          </>
        )}

      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddAdminModal onClose={() => setShowAddModal(false)} onSuccess={(msg) => { showToast(msg); loadAdmins() }} />
        )}
        {editAdmin && (
          <EditAdminModal admin={editAdmin} onClose={() => setEditAdmin(null)} onSuccess={(msg) => { showToast(msg); loadAdmins() }} />
        )}
        {perfAdmin && (
          <PerformanceModal admin={perfAdmin} onClose={() => setPerfAdmin(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
