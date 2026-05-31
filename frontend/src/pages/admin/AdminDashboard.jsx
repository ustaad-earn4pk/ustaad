import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { adminAPI } from '../../api'
import LanguageSwitcher from '../../components/common/LanguageSwitcher'

const stagger = {
  animate: { transition: { staggerChildren: 0.05 } }
}
const fadeUp = {
  initial: { y: 12, opacity: 0 },
  animate: { y: 0, opacity: 1 }
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Admin Panel</p>
            <h1 className="text-xl font-bold text-gray-900">USTAAD 🎓</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-2xl">
          {['overview', 'students', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all
                ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="px-5 pt-5 space-y-4"
      >

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
              {loading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="skeleton h-20" />
                ))
              ) : (
                [
                  { label: 'Total Students', value: stats?.total || 0, icon: '👥', color: 'bg-blue-50' },
                  { label: 'Pending', value: stats?.pending || 0, icon: '⏳', color: 'bg-amber-50' },
                  { label: 'Active', value: stats?.active || 0, icon: '✅', color: 'bg-brand-50' },
                  { label: 'Trial', value: stats?.trial || 0, icon: '🎯', color: 'bg-purple-50' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className={`card ${s.color}`}
                  >
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-xs text-gray-600">{s.label}</p>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Cost monitor */}
            <motion.div variants={fadeUp} className="card">
              <p className="text-sm font-semibold text-gray-700 mb-1">💰 Monthly AI Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats?.monthly_cost_usd?.toFixed(4) || '0.0000'}
              </p>
              <p className="text-xs text-gray-500 mt-1">USD this month</p>
            </motion.div>

            {/* Pending approvals */}
            {students.filter(s => s.status === 'pending').length > 0 && (
              <motion.div variants={fadeUp}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  ⏳ Pending Approvals
                </p>
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
                      <button
                        onClick={() => approveStudent(student.id)}
                        className="btn-primary py-2 px-4 text-sm"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <motion.div variants={fadeUp} className="space-y-2">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16" />)
            ) : students.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-400 text-sm">No students yet</p>
              </div>
            ) : (
              students.map((student) => (
                <motion.div
                  key={student.id}
                  variants={fadeUp}
                  className="card flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/admin/student/${student.id}`)}
                >
                  <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center font-bold text-brand-600">
                    {student.full_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{student.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{student.city || student.email}</p>
                  </div>
                  <span className={`badge ${statusColor[student.status] || 'bg-gray-100 text-gray-600'}`}>
                    {student.status}
                  </span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <motion.div variants={fadeUp} className="card text-center py-8">
            <p className="text-2xl mb-2">💳</p>
            <p className="text-gray-500 text-sm">Payments section — coming soon</p>
          </motion.div>
        )}

      </motion.div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3">
        <div className="flex items-center justify-around">
          {[
            { icon: '🏠', label: 'Dashboard', path: '/admin' },
            { icon: '👥', label: 'Students', path: '/admin/students' },
            { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 px-3 py-1 text-gray-400 hover:text-brand-600 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
