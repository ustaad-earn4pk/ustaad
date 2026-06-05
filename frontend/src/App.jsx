import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import Login from './pages/student/Login'
import Signup from './pages/student/Signup'
import Pending from './pages/student/Pending'
import Dashboard from './pages/student/Dashboard'
import Chat from './pages/student/Chat'
import Tasks, { TaskDetail } from './pages/student/Tasks'
import Onboarding from './pages/student/Onboarding'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudentDetail from './pages/admin/AdminStudentDetail'
import AdminManagement from './pages/admin/AdminManagement'
import ForgotPassword from './pages/student/ForgotPassword'
import ResetPassword from './pages/student/ResetPassword'
import Profile from './pages/student/Profile'
import Renewal from './pages/student/Renewal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
})

// ── Page transition wrapper ────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

function ProtectedRoute({ children, requireAdmin = false, requireSuperAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireSuperAdmin && user?.role !== 'super_admin') return <Navigate to="/admin" replace />
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    if (user?.role === 'admin' || user?.role === 'super_admin') return <Navigate to="/admin" replace />
    if (user?.onboarding_status !== 'completed') return <Navigate to="/onboarding" replace />
    if (user?.status === 'pending') return <Navigate to="/pending" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// ── Animated Routes ────────────────────────────────────────────────────────
function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PublicRoute><PageWrapper><Login /></PageWrapper></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><PageWrapper><Signup /></PageWrapper></PublicRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
        <Route path="/pending" element={<ProtectedRoute><PageWrapper><Pending /></PageWrapper></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><PageWrapper><Chat /></PageWrapper></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><PageWrapper><Tasks /></PageWrapper></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute><PageWrapper><TaskDetail /></PageWrapper></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><PageWrapper><Onboarding /></PageWrapper></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageWrapper><Profile /></PageWrapper></ProtectedRoute>} />
        <Route path="/renewal" element={<ProtectedRoute><PageWrapper><Renewal /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><PageWrapper><AdminDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/student/:id" element={<ProtectedRoute requireAdmin><PageWrapper><AdminStudentDetail /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/management" element={<ProtectedRoute requireSuperAdmin><PageWrapper><AdminManagement /></PageWrapper></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
