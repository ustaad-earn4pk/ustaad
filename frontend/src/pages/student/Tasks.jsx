import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams, Routes, Route } from 'react-router-dom'
import { taskAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'
import api from '../../api'

const STATUS_META = {
  pending:   { color: 'bg-gray-100 text-gray-500',  label: 'Pending' },
  assigned:  { color: 'bg-blue-50 text-blue-600',   label: 'Assigned' },
  submitted: { color: 'bg-amber-50 text-amber-700', label: 'Submitted' },
  graded:    { color: 'bg-brand-50 text-brand-700', label: 'Graded ✓' },
  missed:    { color: 'bg-red-50 text-red-600',     label: 'Missed' },
}

function cleanFeedback(text) {
  return (text || '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '').replace(/---/g, '')
}

// ── Task List ─────────────────────────────────────────────
function TaskList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [todayTask, setTodayTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      const [allRes, todayRes] = await Promise.all([
        taskAPI.getMyTasks(),
        api.get('/tasks/today')
      ])
      setTasks(allRes.data || [])
      setTodayTask(todayRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Tasks 📋</h1>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 text-xl">🏠</button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {['all', 'assigned', 'submitted', 'graded', 'missed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all
                ${filter === f ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f === 'all' ? `All (${tasks.length})` : f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pt-4 space-y-3">

        {/* Today's Task — highlight */}
        {todayTask && todayTask.status === 'assigned' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/tasks/${todayTask.id}`)}
            className="card border-2 border-brand-400 cursor-pointer">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">Aaj ka Task</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎯</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{todayTask.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{todayTask.description}</p>
              </div>
              <span className="text-brand-400 text-lg">›</span>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center pt-20">
            <UstaadBot expression="thinking" size={60} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500 text-sm">Koi task nahi</p>
          </div>
        ) : (
          filtered.map((task, i) => {
            const s = STATUS_META[task.status] || STATUS_META.assigned
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="card-hover cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">
                      {task.status === 'graded' ? '✅' : task.status === 'missed' ? '❌' : '📋'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${s.color}`}>{s.label}</span>
                      {task.ai_score && <span className="text-xs text-brand-600 font-bold">{task.ai_score}%</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{task.title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Day {task.task_number} · {task.points_awarded || 0} pts</p>
                  </div>
                  <span className="text-gray-300 text-lg mt-1">›</span>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: 'Dashboard', path: '/dashboard' },
            { icon: '📋', label: 'Tasks', path: '/tasks', active: true },
            { icon: '💬', label: 'Chat', path: '/chat' },
            { icon: '👤', label: 'Profile', path: '/profile' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${item.active ? 'text-brand-600' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Task Detail ───────────────────────────────────────────
function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [submitType, setSubmitType] = useState('text')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadTask()
  }, [id])

  async function loadTask() {
    try {
      const res = await taskAPI.getTask(id)
      setTask(res.data)
      if (res.data?.ai_feedback_en) {
        setFeedback(res.data.ai_feedback_en)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitText() {
    if (!textAnswer.trim()) return setError('Jawab likhna zaroori hai')
    setSubmitting(true)
    setError('')
    try {
      const res = await api.post(`/tasks/${id}/submit-text`, { text_answer: textAnswer })
      setFeedback(res.data.feedback?.feedback)
      await loadTask()
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit nahi hua')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitScreenshot() {
    if (!screenshot) return setError('Screenshot select karo')
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('screenshot', screenshot)
      fd.append('notes', textAnswer)
      const res = await api.post(`/tasks/${id}/submit-screenshot`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFeedback(res.data.feedback?.feedback)
      await loadTask()
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit nahi hua')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <UstaadBot expression="thinking" size={70} />
    </div>
  )

  if (!task) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-gray-400">Task nahi mila</p>
      <button onClick={() => navigate('/tasks')} className="btn-primary">Wapas Jao</button>
    </div>
  )

  const isSubmitted = ['submitted', 'graded'].includes(task.status)
  const guidelines = task.guidelines_en || []

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tasks')}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">‹</button>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Day {task.task_number}</p>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{task.title}</h1>
          </div>
          {task.ai_score && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Score</p>
              <p className="text-lg font-bold text-brand-600">{task.ai_score}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">

        {/* Task Description */}
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Aaj ka Kaam</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {task.description?.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </p>
        </div>

        {/* Guidelines */}
        {guidelines.length > 0 && (
          <div className="card">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Steps</p>
            <div className="space-y-2">
              {guidelines.map((g, i) => (
                <div key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 bg-brand-50 text-brand-600 rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback — if graded */}
        {(feedback || task.ai_feedback_en) && (
          <div className="card bg-brand-50 border border-brand-100">
            <div className="flex items-center gap-2 mb-3">
              <UstaadBot expression="encouraging" size={36} />
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">USTAAD ka Feedback</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {cleanFeedback(feedback || task.ai_feedback_en)}
            </p>
            {task.ai_score && (
              <div className="mt-3 pt-3 border-t border-brand-100 flex items-center justify-between">
                <span className="text-sm text-gray-600">Score</span>
                <span className="text-xl font-bold text-brand-600">{task.ai_score}/100</span>
              </div>
            )}
          </div>
        )}

        {/* Submit section */}
        {!isSubmitted && (
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submit Karo</p>

            {/* Submit type toggle */}
            <div className="flex gap-2">
              <button onClick={() => setSubmitType('text')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${submitType === 'text' ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                ✍️ Text
              </button>
              <button onClick={() => setSubmitType('screenshot')}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${submitType === 'screenshot' ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                📸 Screenshot
              </button>
            </div>

            {submitType === 'text' && (
              <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                placeholder="Aaj ka task describe karo — kya kiya, kya seekha, koi challenge tha?" rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-brand-400" />
            )}

            {submitType === 'screenshot' && (
              <div className="space-y-2">
                <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-brand-300 transition">
                  {screenshot
                    ? <span className="text-green-600 text-sm">✓ {screenshot.name}</span>
                    : <span className="text-gray-400 text-sm">📸 Screenshot select karo</span>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setScreenshot(e.target.files[0] || null)} />
                </label>
                <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)}
                  placeholder="Optional: kuch notes likhna chahein toh..." rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-brand-400" />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={submitType === 'text' ? handleSubmitText : handleSubmitScreenshot}
              disabled={submitting}
              className="btn-primary w-full py-4 disabled:opacity-50">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Submitting...
                </span>
              ) : '✅ Submit Karein'}
            </button>
          </div>
        )}

        {/* Already submitted */}
        {task.status === 'submitted' && !feedback && (
          <div className="card bg-amber-50 border border-amber-100 text-center py-6">
            <p className="text-3xl mb-2">⏳</p>
            <p className="font-semibold text-gray-900">Submitted!</p>
            <p className="text-sm text-gray-500 mt-1">AI grading ho rahi hai...</p>
          </div>
        )}

        {/* Completed */}
        {task.status === 'graded' && (
          <button onClick={() => navigate('/tasks')} className="btn-primary w-full py-3">
            ← Tasks List pe Wapas Jao
          </button>
        )}

      </div>
    </div>
  )
}

export { TaskList, TaskDetail }
export default TaskList
