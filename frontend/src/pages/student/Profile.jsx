import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useLangStore } from '../../store/langStore'
import { studentAPI, reportingAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const fadeUp = { initial: { y: 16, opacity: 0 }, animate: { y: 0, opacity: 1 } }

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

  // Report + Certificate state
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
      setCertError(err.response?.data?.detail || 'Certificate issue nahi ho saka')
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
    a.download = `USTAAD-Progress-Report-${report.student?.full_name?.replace(' ', '-')}.txt`
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
      `Badges Earned: ${(report.profile?.streak_badges || []).length}`,
      '',
      '─── TASK BREAKDOWN ──────────────────────',
      ...(report.tasks || []).map((task, i) =>
        `${i + 1}. ${task.title} — Score: ${task.ai_score || 'N/A'} — ${task.status}`
      ),
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
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  const earnedBadges = profile?.streak_badges || []
  const earnedIds = earnedBadges.map(b => b.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="text-brand-600 font-medium text-sm">← Back</button>
          <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-500">Logout</button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        <motion.div {...fadeUp} className="flex flex-col items-center py-4">
          <UstaadBot expression={botExpr} size={80} gender={gender} />
          <h2 className="text-xl font-bold text-gray-900 mt-3">{profile?.full_name}</h2>
          <p className="text-sm text-brand-600">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            <span className="text-xs bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-medium">Level {profile?.skill_level || 1}</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{profile?.total_points || 0} pts</span>
            <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-medium">🔥 {profile?.current_streak || 0} day streak</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl">
          {[
            { key: 'basic',        label: 'Basic'      },
            { key: 'education',    label: 'Education'  },
            { key: 'portfolio',    label: 'Portfolio'  },
            { key: 'achievements', label: '🏅 Badges'  },
            { key: 'report',       label: '📊 Report'  },
            { key: 'certificate',  label: '🎓 Cert'    },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`py-2 text-xs font-medium rounded-xl transition-all ${activeTab === tab.key ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'basic' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Full Name</label>
              <input type="text" className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Phone</label>
              <input type="tel" className="input" placeholder="0321-XXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">City</label>
                <input type="text" className="input" placeholder="Lahore" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Age</label>
                <input type="number" className="input" placeholder="22" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Preferred Language</label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} type="button" onClick={() => setForm({ ...form, preferred_language: lang.code })}
                    className={`flex-1 py-2 px-2 rounded-xl text-sm font-medium transition-all ${form.preferred_language === lang.code ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} ${lang.code === 'ur_nastaliq' ? 'font-urdu' : ''}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'education' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <p className="text-xs text-gray-400">Optional — future portfolio mein use hoga</p>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Degree / Qualification</label>
              <input type="text" className="input" placeholder="BSc Computer Science" value={form.education?.degree || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, degree: e.target.value } })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Institute</label>
              <input type="text" className="input" placeholder="University of Punjab" value={form.education?.institute || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, institute: e.target.value } })} />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Year</label>
              <input type="text" className="input" placeholder="2024" value={form.education?.year || ''} onChange={(e) => setForm({ ...form, education: { ...form.education, year: e.target.value } })} />
            </div>
          </motion.div>
        )}

        {activeTab === 'portfolio' && (
          <motion.div {...fadeUp} className="card space-y-4">
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3">
              <p className="text-xs text-brand-700 font-medium">🚀 Coming Soon</p>
              <p className="text-xs text-brand-600 mt-1">USTAAD aapka automatic portfolio generate karega course complete hone ke baad.</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">Portfolio / LinkedIn URL</label>
              <input type="url" className="input" placeholder="https://linkedin.com/in/yourname" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
            </div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div {...fadeUp} className="space-y-3">
            <div className="card flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold text-gray-900">🔥 {profile?.current_streak || 0} days</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Longest Streak</p>
                <p className="text-2xl font-bold text-brand-600">⚡ {profile?.longest_streak || 0} days</p>
              </div>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-gray-700 mb-3">Streak Badges</p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_BADGES.map((badge) => {
                  const earned = earnedIds.includes(badge.id)
                  const earnedData = earnedBadges.find(b => b.id === badge.id)
                  return (
                    <div key={badge.id}
                      className={`rounded-2xl p-3 text-center border transition-all ${earned ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                      <p className="text-3xl mb-1">{badge.emoji}</p>
                      <p className={`text-xs font-semibold ${earned ? 'text-brand-700' : 'text-gray-400'}`}>{badge.label}</p>
                      {earned && earnedData?.earned_at && <p className="text-xs text-gray-400 mt-1">{earnedData.earned_at}</p>}
                      {!earned && <p className="text-xs text-gray-400 mt-1">{badge.days} din ka streak chahiye</p>}
                    </div>
                  )
                })}
              </div>
            </div>
            {earnedBadges.length === 0 && (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm text-gray-500">Abhi koi badge earn nahi hua</p>
                <p className="text-xs text-gray-400 mt-1">3 din streak banao aur pehla badge lo!</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Progress Report Tab */}
        {activeTab === 'report' && (
          <motion.div {...fadeUp} className="space-y-3">
            {reportLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
              </div>
            ) : report ? (
              <>
                {/* Student Info */}
                <div className="card">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Student Info</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{report.student?.full_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">City</span><span className="font-medium">{report.student?.city || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Level</span><span className="font-medium">Level {report.profile?.skill_level || 1}</span></div>
                  </div>
                </div>

                {/* Course */}
                <div className="card">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Course</p>
                  <p className="font-bold text-gray-900">{TRACK_NAMES[report.course?.track] || 'N/A'}</p>
                  <div className="mt-2 bg-gray-100 rounded-full h-2">
                    <div className="bg-brand-400 h-2 rounded-full" style={{ width: `${report.course?.progress_pct || 0}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{report.course?.progress_pct || 0}% complete</p>
                </div>

                {/* Performance */}
                <div className="card">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Performance</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Tasks Assigned', value: report.profile?.total_tasks_assigned || 0 },
                      { label: 'Tasks Completed', value: report.profile?.total_tasks_completed || 0 },
                      { label: 'Average Score', value: `${report.profile?.average_score || 0}%` },
                      { label: 'Total Points', value: report.profile?.total_points || 0 },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-50 rounded-2xl p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Streak */}
                <div className="card flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Current Streak</p>
                    <p className="text-xl font-bold">🔥 {report.profile?.current_streak || 0} days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Longest</p>
                    <p className="text-xl font-bold text-brand-600">⚡ {report.profile?.longest_streak || 0} days</p>
                  </div>
                </div>

                {/* Task Breakdown */}
                {report.tasks?.length > 0 && (
                  <div className="card">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Task Breakdown</p>
                    <div className="space-y-2">
                      {report.tasks.map((task, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <p className="text-xs text-gray-700 flex-1 truncate pr-2">{task.title}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs font-bold ${task.ai_score >= 80 ? 'text-green-600' : task.ai_score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                              {task.ai_score || '-'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${task.status === 'graded' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {task.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={downloadReport}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  📥 Download Report
                </button>
              </>
            ) : (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">📊</p>
                <p className="text-gray-500 text-sm">Report load nahi ho saka</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Certificate Tab */}
        {activeTab === 'certificate' && (
          <motion.div {...fadeUp} className="space-y-3">
            {certificate ? (
              <>
                {/* Certificate Card */}
                <div className="card border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white">
                  <div className="text-center py-4">
                    <p className="text-4xl mb-2">{TROPHY_CONFIG[certificate.trophy]?.emoji || '🎓'}</p>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Certificate of Completion</p>
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                    <p className="text-sm text-gray-500 mt-1">has successfully completed</p>
                    <p className="text-base font-bold text-brand-600 mt-1">{TRACK_NAMES[certificate.track] || certificate.track}</p>

                    <div className={`inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full ${TROPHY_CONFIG[certificate.trophy]?.bg}`}>
                      <span className="text-sm">{TROPHY_CONFIG[certificate.trophy]?.emoji}</span>
                      <span className={`text-sm font-semibold ${TROPHY_CONFIG[certificate.trophy]?.color}`}>
                        {TROPHY_CONFIG[certificate.trophy]?.label}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-brand-100">
                      <p className="text-xs text-gray-400">Average Score: <span className="font-semibold text-gray-700">{certificate.average_score}%</span></p>
                      <p className="text-xs text-gray-400 mt-1">Issued: {new Date(certificate.issued_at).toLocaleDateString('en-PK')}</p>
                      <p className="text-xs font-mono text-gray-500 mt-2 bg-gray-50 px-3 py-1 rounded-lg inline-block">{certificate.certificate_number}</p>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-gray-400">— Yasir Khan, Founder USTAAD —</p>
                      <p className="text-xs text-brand-600 mt-1">ustaad.earn4pk.com</p>
                    </div>
                  </div>
                </div>

                <button onClick={() => {
                  const el = document.querySelector('.certificate-content')
                  window.print()
                }} className="btn-primary w-full flex items-center justify-center gap-2">
                  🖨️ Print / Save Certificate
                </button>
              </>
            ) : (
              <div className="card text-center py-8 space-y-3">
                <p className="text-4xl">🎓</p>
                <p className="font-semibold text-gray-900">Certificate Available hoga</p>
                <p className="text-sm text-gray-500">Course complete karo aur certificate issue karo</p>
                {certError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{certError}</p>
                )}
                <button onClick={handleIssueCertificate} disabled={certLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {certLoading ? (
                    <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Checking...</>
                  ) : '🎓 Issue Certificate'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Save button — sirf edit tabs pe */}
        {['basic', 'education', 'portfolio'].includes(activeTab) && (
          <>
            {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-2xl text-center">✅ Profile update ho gaya!</motion.div>}
            <button onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Saving...</>
              ) : 'Save Changes'}
            </button>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 safe-bottom">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: t('dashboard'), path: '/dashboard' },
            { icon: '📋', label: t('myTasks'), path: '/tasks' },
            { icon: '💬', label: t('chat'), path: '/chat' },
            { icon: '👤', label: t('profile'), path: '/profile', active: true },
          ].map((item) => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${item.active ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
