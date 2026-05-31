import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('ustaad-auth') || '{}')
  const token = auth?.state?.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ustaad-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
}

export const studentAPI = {
  getProfile: () => api.get('/students/me'),
  updateProfile: (data) => api.put('/students/me/profile', data),
}

export const onboardingAPI = {
  start: () => api.post('/onboarding/start'),
  sendMessage: (data) => api.post('/onboarding/message', data),
  getStatus: () => api.get('/onboarding/status'),
}

export const chatAPI = {
  send: (data) => api.post('/chat/send', data),
  getHistory: () => api.get('/chat/history'),
}

export const taskAPI = {
  getMyTasks: () => api.get('/tasks/my'),
  getTask: (id) => api.get(`/tasks/${id}`),
  submit: (taskId, data) => api.post(`/tasks/${taskId}/submit`, data),
}

export const paymentAPI = {
  getPlans: () => api.get('/payments/plans'),
  getAccountInfo: () => api.get('/payments/account-info'),
  submit: (data) => api.post('/payments/submit', data),
}

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: (status) => api.get(`/students/all${status ? `?status=${status}` : ''}`),
  approveStudent: (data) => api.post('/students/approve', data),
  suspendStudent: (id, reason) => api.post(`/students/suspend/${id}`, { reason }),
  updateBotBehavior: (data) => api.put('/students/bot-behavior', data),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (data) => api.put('/admin/settings', data),
  getPrompts: () => api.get('/admin/prompts'),
  updatePrompt: (data) => api.put('/admin/prompts', data),
  createNotice: (data) => api.post('/admin/notices', data),
  getPayments: (status) => api.get(`/admin/payments${status ? `?status=${status}` : ''}`),
  verifyPayment: (id) => api.post(`/admin/payments/${id}/verify`),
  getCosts: () => api.get('/admin/costs'),
}

export default api
