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
  submitForm: (data) => api.post('/onboarding/submit-form', data),
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
  submitWithFile: (formData) => api.post('/payments/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyStatus: () => api.get('/payments/my-payments'),
}
export const courseAPI = {
  getMyCourses: () => api.get('/courses/my'),
  getCourse: (id) => api.get(`/courses/${id}`),
  getPlans: () => api.get('/courses/plans'),
  getAssessment: () => api.get('/courses/assessment'),
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
  getPendingPayments: () => api.get('/payments/admin/pending'),
  reviewPayment: (id, data) => api.post(`/payments/admin/${id}/review`, data),
  getCosts: () => api.get('/admin/costs'),
}
export default api
