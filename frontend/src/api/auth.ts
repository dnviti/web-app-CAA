import { apiRequest } from './client'
import { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse, RefreshTokenResponse } from '../types'

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
  verifyToken: async (): Promise<ApiResponse<User>> => {
    return apiRequest<User>('GET', '/api/auth/verify')
  },

  /**
   * Check editor password
   */
  checkEditorPassword: async (password: string): Promise<ApiResponse<{ success: boolean }>> => {
    return apiRequest<{ success: boolean }>('POST', '/api/check-editor-password', { password })
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> => {
    return apiRequest<RefreshTokenResponse>('POST', '/api/auth/refresh', { refresh_token: refreshToken })
  },

  /**
   * Revoke a refresh token
   */
  revokeToken: async (refreshToken: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>('POST', '/api/auth/revoke', { refresh_token: refreshToken })
  },

  /**
   * Logout (revoke all refresh tokens)
   */
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>('POST', '/api/auth/logout')
  },

  /**
   * Clear local storage (client-side logout fallback)
   */
  clearLocalAuth: (): void => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('refresh_token')
  }
}
