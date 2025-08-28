import axios, { AxiosResponse } from 'axios'
import { ApiResponse } from '../types'

// Get base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:6542'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log('🌐 API Request interceptor TRIGGERED for:', config.url)
    
    const token = localStorage.getItem('jwt_token')
    console.log('🌐 API Request interceptor:', { 
      url: config.url, 
      method: config.method,
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      existingAuthHeader: !!config.headers?.Authorization,
      headers: Object.keys(config.headers || {}),
      headersObject: config.headers
    })
    
    if (token) {
      // Ensure headers exist and set authorization header
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
      console.log('🌐 Authorization header ADDED')
      console.log('🌐 Final request headers after setting auth:', Object.keys(config.headers))
      console.log('🌐 Authorization header value:', config.headers.Authorization?.substring(0, 50) + '...')
    } else {
      console.log('🌐 NO TOKEN - request will be sent without Authorization header')
    }
    
    // Log final config before sending
    console.log('🌐 Final request config:', {
      url: config.url,
      method: config.method,
      hasAuthHeader: !!config.headers?.Authorization,
      headerCount: Object.keys(config.headers || {}).length
    })
    
    return config
  },
  (error) => {
    console.error('🌐 API Request interceptor ERROR:', error)
    return Promise.reject(error)
  }
)

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: any) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('🌐 API Response success:', { 
      url: response.config.url, 
      status: response.status 
    })
    return response
  },
  async (error) => {
    console.log('🌐 API Response error:', { 
      url: error.config?.url, 
      status: error.response?.status,
      message: error.response?.data?.message || error.response?.data?.error || error.message
    })
    
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        // No refresh token available, clear auth and redirect
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('refresh_token')
        processQueue(error, null)
        isRefreshing = false
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken
        })
        
        if (response.data.token && response.data.refresh_token) {
          // Update stored tokens
          localStorage.setItem('jwt_token', response.data.token)
          localStorage.setItem('refresh_token', response.data.refresh_token)
          
          // Process queued requests
          processQueue(null, response.data.token)
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`
          return apiClient(originalRequest)
        } else {
          throw new Error('Invalid refresh response')
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        
        // Clear tokens and process queue
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('refresh_token')
        processQueue(refreshError, null)
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    return Promise.reject(error)
  }
)

// Generic API request wrapper
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  options?: any
): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.request({
      method,
      url,
      data,
      ...options,
    })
    
    return {
      success: true,
      data: response.data,
    }
  } catch (error: any) {
    console.error(`API Error [${method} ${url}]:`, error)
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Errore di connessione'
    
    return {
      success: false,
      error: errorMessage,
      data: error.response?.data,
    }
  }
}

export { API_BASE_URL }
