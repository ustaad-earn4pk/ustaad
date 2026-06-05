import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI, reportingAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const fadeUp = { initial: { y: 12, opacity: 0 }, animate: { y: 0, opacity: 1 } }

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur_nastaliq', label: 'اردو' },
  { code: 'ur_roman', label: 'Roman Urdu' },
]

const ALL_BADGES = [
  { id: 'streak_3',  emoji: '🔥', label: '3 Day Streak',  days: 3  },
  { id: 'streak_7',  emoji: '⚡', label: '7 Day Streak',  days: 7  },
  { id: 'streak_14', emoji: '💪', label: '14 Day Streak', days: 14 },
  { id: 'streak_30', emoji: '🏆', label: '30 Day Streak', days: 30 },
]

const TRACK_NAMES = {
  computer_basics: 'Computer & Internet Basics',
  web_fundamentals: 'Web & Business Basics',
  ghl_developer: 'GoHighLevel Developer',
  integration_expert: 'Integration Expert',
  full_stack_automation: 'Full Stack Automation',
  client_hunting: 'Client Hunting & Portfolio',
}

const TROPHY_CONFIG = {
  gold:   { emoji: '🏆', label: 'Distinction', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  silver: { emoji: '⚡', label: 'Pass',         color: 'text-gray-600',   bg: 'bg-gray-50'   },
  bronze: { emoji: '🥉', label: 'Bare Pass',    color: 'text-orange-600', bg: 'bg-orange-50' },
}

const TABS = [
  { key: 'basic',        label: 'Basic',    icon: '👤' },
  { key: 'education',    label: 'Education',icon: '🎓' },
  { key: 'portfolio',    label: 'Portfolio', icon: '💼' },
  { key: 'achievements', label: 'Badges',   icon: '🏅' },
  { key: 'report',       label: 'Report',   icon: '📊' },
  { key: 'certificate',  label: 'Cert',     icon: '📜' },
]

export default function Profile() {
  const { user, logout, setAuth } = useAuthStore()
  const { t, setLanguage } = useLangStore()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [gender, setGender] = useState('male')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [botExpr, setBotExpr] = useState('cool')
  const [activeTab, setActiveTab] = useState('basic')

  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [certificate, setCertificate] = useState(null)
  const [certLoading, setCertLoading] = useState(false)
  const [certError, setCertError] = useState('')

  const [form, setForm] = useState({
    full_name: '', phone: '', city: '', age: '',
    preferred_language: 'en', portfolio_url: '',
    education: { degree: '', institute: '', year: '' }
  })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    try {
      const res = await studentAPI.getProfile()
      const data = res.data
      setProfile(data)
      setGender(data.gender || 'male')
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        age: data.age || '',
        preferred_language: data.preferred_language || 'en',
        portfolio_url: data.portfolio_url || '',
        education: data.education || { degree: '', institute: '', year: '' }
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    setBotExpr('thinking')
    try {
      await studentAPI.updateProfile({ ...form, age: form.age ? parseInt(form.age) : null })
      setSuccess(true)
      setBotExpr('celebrating')
      if (form.preferred_language !== user?.preferred_language) {
        setLanguage(form.preferred_language)
        setAuth({ ...user, preferred_language: form.preferred_language }, null)
      }
      setTimeout(() => { setBotExpr('cool'); setSuccess(false) }, 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Update fail ho gaya.')
      setBotExpr('strict')
      setTimeout(() => setBotExpr('cool'), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function loadReport() {
    setReportLoading(true)
    try {
      const res = await reportingAPI.getProgressReport()
      setReport(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setReportLoading(false)
    }
  }

  async function handleIssueCertificate() {
    setCertLoading(true)
    setCertError('')
    try {
      const res = await reportingAPI.issueCertificate()
      setCertificate(res.data.certificate)
    } catch (err) {
      setCertError(err.response?.data?.detail || 'Certificate issue nahi ho saca')
    } finally {
      setCertLoading(false)
    }
  }

  async function loadCertificate() {
    try {
      const res = await reportingAPI.getMyCertificate()
      if (res.data?.length > 0) setCertificate(res.data[0])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (activeTab === 'report') loadReport()
    if (activeTab === 'certificate') loadCertificate()
  }, [activeTab])

  function downloadReport() {
    if (!report) return
    const content = generateReportText(report)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `USTAAD-Report-${report.student?.full_name?.replace(' ', '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function generateReportText(report) {
    const lines = [
      '═══════════════════════════════════════',
      '         USTAAD PROGRESS REPORT         ',
      '═══════════════════════════════════════',
      '',
      `Student: ${report.student?.full_name}`,
      `Email: ${report.student?.email}`,
      `City: ${report.student?.city || 'N/A'}`,
      `Generated: ${new Date(report.generated_at).toLocaleDateString('en-PK')}`,
      '',
      '─── COURSE ─────────────────────────────',
      `Track: ${TRACK_NAMES[report.course?.track] || report.course?.track || 'N/A'}`,
      `Progress: ${report.course?.progress_pct || 0}%`,
      `Status: ${report.course?.completed_at ? 'Completed ✅' : 'In Progress'}`,
      '',
      '─── PERFORMANCE ─────────────────────────',
      `Total Tasks: ${report.profile?.total_tasks_assigned || 0}`,
      `Completed: ${report.profile?.total_tasks_completed || 0}`,
      `Average Score: ${report.profile?.average_score || 0}%`,
      `Total Points: ${report.profile?.total_points || 0}`,
      '',
      '─── STREAK ──────────────────────────────',
      `Current Streak: ${report.profile?.current_streak || 0} days`,
      `Longest Streak: ${report.profile?.longest_streak || 0} days`,
      '',
      '═══════════════════════════════════════',
      '    USTAAD — Seekho. Karo. Kamao.      ',
      '    ustaad.earn4pk.com                 ',
      '═══════════════════════════════════════',
    ]
    return lines.join('\n')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  const earnedBadges = profile?.streak_badges || []
  const earnedIds = earnedBadges.map(b => b.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100 px-5 pt-10 pb-0 safe-top">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate('/dashboard')}
            className="w-9 h-9 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">
            ←
          </button>
          <h1 className="text-base font-bold text-gray-900">My Profile</h1>
          <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1">Logout</button>
        </div>

        {/* Profile Card — horizontal layout */}
        <div className="flex items-center gap-4 pb-4">
          <div className="flex-shrink-0">
            <UstaadBot expression={botExpr} size={72} gender={gender} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.full_name}</h2>
            <p className="text-xs text-brand-600 truncate">{profile?.email}</p>
            {/* Stats row */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">
                Lv.{profile?.skill_level || 1}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                {profile?.total_points || 0} pts
              </span>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                🔥 {profile?.current_streak || 0}d
              </span>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                ⚡ {profile?.longest_streak || 0}d best
              </span>
            </div>
          </div>
        </div>

        {/* Tabs — horizontal scroll */}
        <div className="flex gap-1 overflow-x-auto pb-0 -mx-5 px-5 scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-5 pt-4 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>

            {/* BASIC */}
            {activeTab === 'basic' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Full Name</label>
                      <input type="text" className="input w-full" value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Phone</label>
                      <input type="tel" className="input w-full" placeholder="0321-XXXXXXX" value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium mb-1 block">Age</label>
                      <input type="number" className="input w-full" placeholder="22" value={form.age}
                        onChange={(e) => setForm({ ...form, age: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 font-medium mb-1 block">City</label>
                      <input type="text" className="input w-full" placeholder="Lahore" value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-2 block">Language</label>
                    <div className="flex gap-2">
                      {LANGUAGES.map((lang) => (
                        <button key={lang.code} type="button"
                          onClick={() => setForm({ ...form, preferred_language: lang.code })}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all
                            ${form.preferred_language === lang.code ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600'}
                            ${lang.code === 'ur_nastaliq' ? 'font-urdu' : ''}`}>
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {activeTab === 'education' && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                <p className="text-xs text-gray-400">Optional — future portfolio mein use hoga</p>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Degree / Qualification</label>
                  <input type="text" className="input w-full" placeholder="BSc Computer Science"
                    value={form.education?.degree || ''}
                    onChange={(e) => setForm({ ...form, education: { ...form.education, degree: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Institute</label>
                  <input type="text" className="input w-full" placeholder="University of Punjab"
                    value={form.education?.institute || ''}
                    onChange={(e) => setForm({ ...form, education: { ...form.education, institute: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Year</label>
                  <input type="text" className="input w-full" placeholder="2024"
                    value={form.education?.year || ''}
                    onChange={(e) => setForm({ ...form, education: { ...form.education, year: e.target.value } })} />
                </div>
              </div>
            )}

            {/* PORTFOLIO */}
            {activeTab === 'portfolio' && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-3">
                  <p className="text-xs text-brand-700 font-medium">🚀 Coming Soon</p>
                  <p className="text-xs text-brand-600 mt-1">USTAAD aapka automatic portfolio generate karega course complete hone ke baad.</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">Portfolio / LinkedIn URL</label>
                  <input type="url" className="input w-full" placeholder="https://linkedin.com/in/yourname"
                    value={form.portfolio_url}
                    onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
                </div>
              </div>
            )}

            {/* BADGES */}
            {activeTab === 'achievements' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-gray-900">🔥 {profile?.current_streak || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Current Streak</p>
                  </div>
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
                    <p className="text-2xl font-bold text-brand-600">⚡ {profile?.longest_streak || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Longest Streak</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {ALL_BADGES.map((badge) => {
                    const earned = earnedIds.includes(badge.id)
                    const earnedData = earnedBadges.find(b => b.id === badge.id)
                    return (
                      <div key={badge.id}
                        className={`bg-white rounded-2xl p-3 text-center border transition-all
                          ${earned ? 'border-brand-200 bg-brand-50' : 'border-gray-100 opacity-50'}`}>
                        <p className="text-3xl mb-1">{badge.emoji}</p>
                        <p className={`text-xs font-semibold ${earned ? 'text-brand-700' : 'text-gray-400'}`}>
                          {badge.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {earned && earnedData?.earned_at ? earnedData.earned_at : `${badge.days} din chahiye`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* REPORT */}
            {activeTab === 'report' && (
              <div className="space-y-3">
                {reportLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
                  </div>
                ) : report ? (
                  <>
                    {/* Student + Course */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Progress</p>
                        <span className="text-xs font-bold text-brand-600">{report.course?.progress_pct || 0}%</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {TRACK_NAMES[report.course?.track] || 'N/A'}
                      </p>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-brand-400 h-2 rounded-full transition-all"
                          style={{ width: `${report.course?.progress_pct || 0}%` }} />
                      </div>
                    </div>

                    {/* Performance Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Tasks Assigned', value: report.profile?.total_tasks_assigned || 0, icon: '📋' },
                        { label: 'Completed', value: report.profile?.total_tasks_completed || 0, icon: '✅' },
                        { label: 'Avg Score', value: `${report.profile?.average_score || 0}%`, icon: '⭐' },
                        { label: 'Total Points', value: report.profile?.total_points || 0, icon: '🏆' },
                      ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-3 border border-gray-100 flex items-center gap-3">
                          <span className="text-xl">{stat.icon}</span>
                          <div>
                            <p className="text-base font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Task Breakdown */}
                    {report.tasks?.length > 0 && (
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Breakdown</p>
                        <div className="space-y-2">
                          {report.tasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                              <p className="text-xs text-gray-700 flex-1 truncate">{task.title}</p>
                              <span className={`text-xs font-bold w-8 text-right
                                ${task.ai_score >= 80 ? 'text-green-600' : task.ai_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                                {task.ai_score || '-'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0
                                ${task.status === 'graded' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button onClick={downloadReport} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                      📥 Download Report
                    </button>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                    <p className="text-2xl mb-2">📊</p>
                    <p className="text-gray-500 text-sm">Report load nahi ho saka</p>
                  </div>
                )}
              </div>
            )}

            {/* CERTIFICATE */}
            {activeTab === 'certificate' && (
              <div className="space-y-3">
                {certificate ? (
                  <>
                    <div className="bg-white rounded-2xl border-2 border-brand-200 p-5">
                      <div className="text-center space-y-2">
                        <p className="text-4xl">{TROPHY_CONFIG[certificate.trophy]?.emoji || '🎓'}</p>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Certificate of Completion</p>
                        <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                        <p className="text-sm text-gray-500">has successfully completed</p>
                        <p className="text-base font-bold text-brand-600">{TRACK_NAMES[certificate.track] || certificate.track}</p>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${TROPHY_CONFIG[certificate.trophy]?.bg}`}>
                          <span>{TROPHY_CONFIG[certificate.trophy]?.emoji}</span>
                          <span className={`text-sm font-semibold ${TROPHY_CONFIG[certificate.trophy]?.color}`}>
                            {TROPHY_CONFIG[certificate.trophy]?.label}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 space-y-1">
                          <p className="text-xs text-gray-400">
                            Avg Score: <span className="font-semibold text-gray-700">{certificate.average_score}%</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Issued: {new Date(certificate.issued_at).toLocaleDateString('en-PK')}
                          </p>
                          <p className="text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1 rounded-lg inline-block">
                            {certificate.certificate_number}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">— Yasir Khan, Founder USTAAD —</p>
                        <p className="text-xs text-brand-600">ustaad.earn4pk.com</p>
                      </div>
                    </div>
                    <button onClick={() => window.print()}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                      🖨️ Print / Save Certificate
                    </button>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-3">
                    <p className="text-4xl">🎓</p>
                    <p className="font-semibold text-gray-900">Certificate Available hoga</p>
                    <p className="text-sm text-gray-500">Course complete karo aur certificate issue karo</p>
                    {certError && (
                      <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{certError}</p>
                    )}
                    <button onClick={handleIssueCertificate} disabled={certLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                      {certLoading ? (
                        <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Checking...</>
                      ) : '🎓 Issue Certificate'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Save Button */}
        {['basic', 'education', 'portfolio'].includes(activeTab) && (
          <div className="space-y-2 pb-2">
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-xl">{error}</motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-green-50 text-green-600 text-xs px-4 py-2.5 rounded-xl text-center">
                  ✅ Profile update ho gaya!
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {saving ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: t('dashboard'), path: '/dashboard' },
            { icon: '📋', label: t('myTasks'), path: '/tasks' },
            { icon: '💬', label: t('chat'), path: '/chat' },
            { icon: '👤', label: t('profile'), path: '/profile', active: true },
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
