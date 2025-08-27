import { apiRequest } from './client'
import { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '../types'

export const authApi = {
  /**
   * Login user with credentials
   */
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>('POST', '/api/auth/login', credentials)
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    return apiRequest<AuthResponse>('POST', '/api/auth/register', userData)
  },

  /**
   * Verify JWT token and get user info
   */
  verifyToken: async (token: string): Promise<ApiResponse<User>> => {
    return apiRequest<User>('GET', '/api/auth/verify', null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  },

  /**
   * Check editor password
   */
  checkEditorPassword: async (password: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest<{ success: boolean }>('POST', '/api/check-editor-password', { password })
  },

  /**
   * Logout (client-side only for now)
   */
  logout: (): void => {
    localStorage.removeItem('jwt_token')
  }
}
