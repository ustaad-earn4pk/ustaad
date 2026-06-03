import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import Login from './pages/student/Login'
import Signup from './pages/student/Signup'
import Pending from './pages/student/Pending'
import Dashboard from './pages/student/Dashboard'
import Chat from './pages/student/Chat'
import Tasks, { TaskDetail } from './pages/student/Tasks'
import Onboarding from './pages/student/Onboarding'
import AdminDashboard from './pages/admin/AdminDashboard'
import ForgotPassword from './pages/student/ForgotPassword'
import ResetPassword from './pages/student/ResetPassword'
import Profile from './pages/student/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 }
  }
})

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requireAdmin && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />
    if (user?.onboarding_status !== 'completed') return <Navigate to="/onboarding" replace />
    if (user?.status === 'pending') return <Navigate to="/pending" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Password reset — public */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/pending" element={<ProtectedRoute><Pending /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
