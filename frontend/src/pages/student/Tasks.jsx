import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { taskAPI } from '../../api'
import UstaadBot from '../../components/bot/UstaadBot'

const STATUS_META = {
  pending:   { color: 'bg-gray-100 text-gray-500',  label: 'Pending' },
  assigned:  { color: 'bg-blue-50 text-blue-600',   label: 'Assigned' },
  submitted: { color: 'bg-amber-50 text-amber-700', label: 'Submitted' },
  graded:    { color: 'bg-brand-50 text-brand-700', label: 'Graded' },
  missed:    { color: 'bg-red-50 text-red-600',     label: 'Missed' },
}

function TaskList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    taskAPI.getMyTasks().then(r => setTasks(r.data || [])).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Tasks 📋</h1>
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 text-xl">🏠</button>
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {['all','assigned','submitted','graded','missed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? 'bg-brand-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {f === 'all' ? `All (${tasks.length})` : f}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pt-4 space-y-3">
        {loading ? <div className="flex justify-center pt-20"><UstaadBot expression="thinking" size={60} /></div>
        : filtered.length === 0 ? <div className="card text-center py-12"><p className="text-4xl mb-3">📋</p><p className="text-gray-500 text-sm">Koi task nahi</p></div>
        : filtered.map((task, i) => {
          const s = STATUS_META[task.status] || STATUS_META.assigned
          return (
            <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => navigate(`/tasks/${task.id}`)} className="card-hover cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center flex-shrink-0"><span className="text-2xl">📋</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className={`badge ${s.color}`}>{s.label}</span></div>
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{task.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{task.scheduled_for} · {task.estimated_minutes || 30} min</p>
                </div>
                <span className="text-gray-300 text-lg mt-1">›</span>
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
        <div className="flex items-center justify-around">
          {[{icon:'🏠',label:'Dashboard',path:'/dashboard'},{icon:'📋',label:'Tasks',path:'/tasks',active:true},{icon:'💬',label:'Chat',path:'/chat'},{icon:'👤',label:'Profile',path:'/profile'}].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl ${item.active ? 'text-brand-600' : 'text-gray-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    taskAPI.getTask(id).then(r => { setTask(r.data); if(['submitted','graded'].includes(r.data?.status)) setSubmitted(true) }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!textAnswer.trim()) { setError('Jawab likhna zaroori hai'); return }
    setSubmitting(true); setError('')
    try {
      const fd = new FormData(); fd.append('text_answer', textAnswer); fd.append('submission_type', 'text')
      await taskAPI.submit(id, fd)
      setSubmitted(true)
      const r = await taskAPI.getTask(id); setTask(r.data)
    } catch(err) { setError(err.response?.data?.detail || 'Submit nahi hua') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><UstaadBot expression="thinking" size={70} /></div>
  if (!task) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-gray-400">Task nahi mila</p><button onClick={() => navigate('/tasks')} className="btn-primary">Wapas Jao</button></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4 safe-top">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tasks')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">‹</button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 leading-tight">{task.title}</h1>
        </div>
      </div>
      <div className="px-5 pt-5 space-y-4">
        <div className="card"><p className="text-sm text-gray-700 leading-relaxed">{task.description}</p><div className="flex gap-3 mt-4 pt-4 border-t border-gray-50"><span className="text-xs text-gray-500">⏱️ {task.estimated_minutes || 30} min</span><span className="text-xs text-gray-500">📅 {task.scheduled_for}</span>{task.xp_reward && <span className="text-xs text-amber-600 font-medium">⭐ +{task.xp_reward} XP</span>}</div></div>
        {task.status === 'graded' && <div className="card"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Score</p><p className="text-3xl font-bold text-brand-600">{task.total_score}%</p>{task.feedback && <p className="text-sm text-gray-600 mt-2">{task.feedback}</p>}</div>}
        {task.status === 'assigned' && !submitted && (
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Submit</p>
            <textarea value={textAnswer} onChange={e => setTextAnswer(e.target.value)} placeholder="Yahan apna jawab likhein..." rows={5} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-brand-400" />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-4">
              {submitting ? 'Submit ho raha hai...' : '✅ Submit Karein'}
            </motion.button>
          </div>
        )}
        {submitted && task.status === 'submitted' && <div className="card bg-amber-50 border border-amber-100 text-center py-6"><p className="text-3xl mb-2">⏳</p><p className="font-semibold text-gray-900">Submitted!</p><p className="text-sm text-gray-500 mt-1">Grading pending hai.</p></div>}
      </div>
    </div>
  )
}

export { TaskList, TaskDetail }
export default TaskList