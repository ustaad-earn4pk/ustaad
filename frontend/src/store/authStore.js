import { create } from 'zustand'
import { persist } from 'zustand/middleware'
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      updateLanguage: (lang) => set(state => ({
        user: { ...state.user, preferred_language: lang }
      })),
      isAdmin: () => ['admin', 'super_admin'].includes(get().user?.role),
      isSuperAdmin: () => get().user?.role === 'super_admin',
      isStudent: () => get().user?.role === 'student',
      getLanguage: () => get().user?.preferred_language || 'en',
    }),
    {
      name: 'ustaad-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
