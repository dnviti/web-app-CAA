import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthState, LoginRequest, RegisterRequest } from '../types'
import { authApi } from '../api/auth'
import { toast } from 'react-hot-toast'

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<boolean>
  register: (userData: RegisterRequest) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  checkEditorPassword: (password: string) => Promise<boolean>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          
          if (response.success && response.data) {
            // Store token in localStorage for API client
            localStorage.setItem('jwt_token', response.data.token)
            
            set({
              user: response.data.user,
              token: response.data.token,
              isLoading: false,
              error: null,
            })
            
            toast.success(`Benvenuto, ${response.data.user.username}!`)
            return true
          } else {
            const errorMessage = response.error || 'Login fallito'
            set({ error: errorMessage, isLoading: false })
            toast.error(errorMessage)
            return false
          }
        } catch (error) {
          const errorMessage = 'Errore di connessione'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return false
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(userData)
          
          if (response.success && response.data) {
            // Store token in localStorage for API client
            localStorage.setItem('jwt_token', response.data.token)
            
            set({
              user: response.data.user,
              token: response.data.token,
              isLoading: false,
              error: null,
            })
            
            toast.success('Registrazione completata!')
            return true
          } else {
            const errorMessage = response.error || 'Registrazione fallita'
            set({ error: errorMessage, isLoading: false })
            toast.error(errorMessage)
            return false
          }
        } catch (error) {
          const errorMessage = 'Errore di connessione'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return false
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          error: null,
        })
        
        // Clear all localStorage data
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('isFirstLogin')
        
        toast.success('Logout effettuato')
      },

      checkAuth: async () => {
        let { token } = get()
        
        // If no token in store, check localStorage
        if (!token) {
          token = localStorage.getItem('jwt_token')
          if (token) {
            // Update store with token from localStorage
            set({ token })
          }
        }
        
        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })
        
        try {
          // Verify token with backend
          const response = await authApi.verifyToken(token)
          
          if (response.success && response.data) {
            // Ensure token is in localStorage
            localStorage.setItem('jwt_token', token)
            
            set({
              user: response.data,
              token,
              isLoading: false,
              error: null,
            })
          } else {
            // Token invalid, clear auth state
            localStorage.removeItem('jwt_token')
            set({
              user: null,
              token: null,
              isLoading: false,
              error: null,
            })
          }
        } catch (error) {
          // On error, clear auth state
          localStorage.removeItem('jwt_token')
          set({
            user: null,
            token: null,
            isLoading: false,
            error: null,
          })
        }
      },

      checkEditorPassword: async (password) => {
        const { token } = get()
        if (!token) return false

        try {
          const response = await authApi.checkEditorPassword(password)
          
          if (response.success) {
            toast.success('Modalità editor attivata')
            return true
          } else {
            toast.error('Password errata')
            return false
          }
        } catch (error) {
          toast.error('Errore di verifica password')
          return false
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)
