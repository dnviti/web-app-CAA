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

export const useAuthStore = create<AuthState & AuthActions & { isInitialized: boolean }>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isInitialized: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        console.log('🔐 Login starting with credentials:', { username: credentials.username })
        try {
          const response = await authApi.login(credentials)
          console.log('🔐 Login API response:', response)
          
          if (response.success && response.data) {
            console.log('🔐 Login successful, storing tokens:', {
              hasToken: !!response.data.token,
              hasRefreshToken: !!response.data.refresh_token,
              hasUser: !!response.data.user
            })
            
            // Store both tokens in localStorage for API client
            localStorage.setItem('jwt_token', response.data.token)
            localStorage.setItem('refresh_token', response.data.refresh_token)
            
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
            console.error('🔐 Login failed:', errorMessage)
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
            // Store both tokens in localStorage for API client
            localStorage.setItem('jwt_token', response.data.token)
            localStorage.setItem('refresh_token', response.data.refresh_token)
            
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

      logout: async () => {
        try {
          // Try to logout on the server (revoke refresh tokens)
          await authApi.logout()
        } catch (error) {
          console.warn('Server logout failed, continuing with client-side logout')
        }
        
        set({
          user: null,
          token: null,
          error: null,
          isInitialized: true,
        })
        
        // Clear all localStorage data
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('isFirstLogin')
        
        toast.success('Logout effettuato')
      },

      checkAuth: async () => {
        const { token: currentToken, isInitialized } = get()
        
        // If already checking or initialized, don't check again
        if (isInitialized) {
          console.log('checkAuth: already initialized, skipping')
          return
        }
        
        console.log('checkAuth: start', { currentToken: !!currentToken })
        
        // If no token in store, check localStorage
        let token = currentToken
        if (!token) {
          token = localStorage.getItem('jwt_token')
          if (token) {
            console.log('checkAuth: found token in localStorage')
          }
        }
        
        if (!token) {
          console.log('checkAuth: no token found, setting initialized')
          set({ 
            user: null, 
            token: null, 
            isLoading: false, 
            isInitialized: true 
          })
          return
        }

        // Set loading state and update token if found in localStorage
        console.log('checkAuth: verifying token, setting loading')
        set({ 
          token, 
          isLoading: true 
        })
        
        try {
          console.log('checkAuth: calling verify API')
          // Verify token with backend - the interceptor will add the token
          const response = await authApi.verifyToken()
          
          if (response.success && response.data) {
            console.log('checkAuth: token valid, setting user')
            // Ensure token is in localStorage
            localStorage.setItem('jwt_token', token)
            
            set({
              user: response.data,
              token,
              isLoading: false,
              error: null,
              isInitialized: true,
            })
          } else {
            console.log('checkAuth: token invalid, clearing auth')
            // Token invalid, clear auth state
            localStorage.removeItem('jwt_token')
            localStorage.removeItem('refresh_token')
            set({
              user: null,
              token: null,
              isLoading: false,
              error: null,
              isInitialized: true,
            })
          }
        } catch (error) {
          console.log('checkAuth: error verifying token', error)
          // On error, clear auth state
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            token: null,
            isLoading: false,
            error: null,
            isInitialized: true,
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
        isInitialized: state.isInitialized,
      }),
    }
  )
)
